import type { AiReviewData } from './store';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;

// Verify that extracted frames actually show a vehicle.
// Samples 3 frames spread across the full set to keep cost low.
export async function verifyVehicleInFrames(frames: string[]): Promise<{ ok: boolean; reason?: string }> {
  if (!frames.length) return { ok: false, reason: 'No frames to verify.' };

  // Pick 3 evenly-spaced frames for the check
  const indices = [0, Math.floor(frames.length / 2), frames.length - 1];
  const samples = [...new Set(indices)].map(i => frames[i]);

  const content: unknown[] = [
    {
      type: 'text',
      text: 'The following frames were extracted from a video. Does this video show a vehicle (car, truck, van, or SUV)? Reply with JSON: { "is_vehicle": true/false, "confidence": 0-100, "reason": "one sentence" }',
    },
    ...samples.map(f => ({ type: 'image_url', image_url: { url: f, detail: 'low' } })),
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 100,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content }],
    }),
  });

  if (!response.ok) return { ok: true }; // fail open if API is down — don't block the user

  const json = await response.json();
  const raw = json.choices?.[0]?.message?.content ?? '{}';
  try {
    const parsed = JSON.parse(raw) as { is_vehicle?: boolean; confidence?: number; reason?: string };
    if (parsed.is_vehicle === false && (parsed.confidence ?? 100) >= 70) {
      return { ok: false, reason: parsed.reason || 'No vehicle detected in the video.' };
    }
  } catch { /* ignore parse errors, fail open */ }

  return { ok: true };
}

const SYSTEM_PROMPT = `You are an expert vehicle damage inspection AI for a car rental company.
You will be shown two sets of video frames of the same vehicle:
- CHECKOUT frames: taken before the customer drove the car (the baseline condition)
- CHECKIN frames: taken when the customer returned the car

Your job is to identify any NEW damage that appeared during the rental.
Be conservative: only flag clear, unambiguous new damage. Ignore dirt, lighting differences, shadows, and minor reflections.
Focus on: dents, scratches, cracks, chips, broken parts, missing trim, or structural deformation.

Return ONLY a valid JSON object:
{
  "summary": {
    "new_damage_detected": boolean,
    "overall_confidence": number 0–100,
    "inspection_result": "pass" | "review" | "fail"
  },
  "damages": [
    {
      "panel_or_area": "e.g. front bumper",
      "side": "e.g. front-left",
      "damage_type": "scratch | dent | crack | chip | broken | other",
      "severity": "minor" | "moderate" | "major",
      "confidence": number 0–100,
      "status": "new_damage",
      "description": "one sentence describing what you see",
      "reasoning": "one sentence explaining why this appears to be new vs checkout"
    }
  ],
  "unreviewable_areas": [
    { "panel_or_area": string, "reason": "e.g. not visible in either set of frames" }
  ],
  "recommended_action": "approve_return" | "manual_review" | "charge_damage_fee"
}
Rules:
- "pass" → no new damage → "approve_return"
- "review" → uncertain → "manual_review"
- "fail" → clear new damage → "charge_damage_fee"`;

export async function runAiComparison(
  checkoutFrames: string[],
  checkinFrames: string[],
  existingDamageNotes: string,
  checkinNotes: string
): Promise<AiReviewData> {
  const content: unknown[] = [];

  let contextText = 'Compare the vehicle condition between CHECKOUT (baseline) and CHECKIN (returned) frames below.';
  if (existingDamageNotes.trim()) {
    contextText += `\n\nPRE-EXISTING DAMAGE at checkout (do NOT flag these): ${existingDamageNotes}`;
  }
  if (checkinNotes.trim()) {
    contextText += `\n\nCUSTOMER COMMENTS at return: ${checkinNotes}`;
  }
  content.push({ type: 'text', text: contextText });

  // Add checkout frames
  content.push({ type: 'text', text: '\n=== CHECKOUT FRAMES (baseline condition) ===' });
  for (let i = 0; i < checkoutFrames.length; i++) {
    content.push({ type: 'text', text: `Checkout frame ${i + 1}/${checkoutFrames.length}:` });
    content.push({ type: 'image_url', image_url: { url: checkoutFrames[i], detail: 'low' } });
  }

  // Add checkin frames
  content.push({ type: 'text', text: '\n=== CHECKIN FRAMES (returned condition) ===' });
  for (let i = 0; i < checkinFrames.length; i++) {
    content.push({ type: 'text', text: `Checkin frame ${i + 1}/${checkinFrames.length}:` });
    content.push({ type: 'image_url', image_url: { url: checkinFrames[i], detail: 'low' } });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`OpenAI API ${response.status}: ${errBody}`);
  }

  const json = await response.json();
  const raw: string = json.choices?.[0]?.message?.content ?? '';
  if (!raw) throw new Error('Empty response from OpenAI');

  return normalizeResponse(JSON.parse(raw));
}

function normalizeResponse(parsed: Record<string, unknown>): AiReviewData {
  const summary = (parsed.summary as Record<string, unknown>) ?? {};
  return {
    summary: {
      new_damage_detected: Boolean(summary.new_damage_detected ?? false),
      overall_confidence: Number(summary.overall_confidence ?? 80),
      inspection_result: (['pass', 'review', 'fail'].includes(summary.inspection_result as string)
        ? summary.inspection_result : 'review') as 'pass' | 'review' | 'fail',
    },
    damages: Array.isArray(parsed.damages) ? parsed.damages as AiReviewData['damages'] : [],
    unreviewable_areas: Array.isArray(parsed.unreviewable_areas)
      ? parsed.unreviewable_areas as AiReviewData['unreviewable_areas'] : [],
    recommended_action: (parsed.recommended_action as string) ?? 'manual_review',
  };
}
