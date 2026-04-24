import type { AiReviewData } from './store';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;

// Resize a base64 data URL to max 800px on the longest side before sending to the API.
// Reduces payload from ~300KB/image to ~60KB/image while keeping enough detail.
async function resizeImage(dataUrl: string, maxPx = 800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.80));
    };
    img.onerror = () => resolve(dataUrl); // fallback: send original
    img.src = dataUrl;
  });
}

export interface AngleImages {
  angle: string;
  checkout: string | null;
  checkin: string | null;
}

const SYSTEM_PROMPT = `You are an expert vehicle damage inspection AI for a car rental company.
You will be shown pairs of vehicle photos: one taken at CHECK-OUT (when the customer picked up the car) and one at CHECK-IN (when they returned it).
Your job is to identify any NEW damage that appeared during the rental period.
Be conservative: only flag clear, unambiguous new damage. Dirt, lighting differences, and minor reflections are NOT damage.
Return ONLY a valid JSON object with this exact structure:
{
  "summary": {
    "new_damage_detected": boolean,
    "overall_confidence": number between 0-100,
    "inspection_result": "pass" | "review" | "fail"
  },
  "damages": [
    {
      "panel_or_area": "e.g. front bumper",
      "side": "e.g. front-left",
      "damage_type": "e.g. scratch | dent | crack | chip",
      "severity": "minor" | "moderate" | "major",
      "confidence": number between 0-100,
      "status": "new_damage",
      "description": "one sentence describing what you see",
      "reasoning": "one sentence explaining why you believe this is new damage"
    }
  ],
  "unreviewable_areas": [
    { "panel_or_area": string, "reason": "e.g. too dark, angle mismatch, obstructed" }
  ],
  "recommended_action": "approve_return" | "manual_review" | "charge_damage_fee"
}
Rules:
- inspection_result is "pass" if no damage, "review" if uncertain, "fail" if clear new damage
- recommended_action is "approve_return" for pass, "manual_review" for review, "charge_damage_fee" for fail
- If both checkout and checkin images look the same, return pass with empty damages array`;

export async function runAiComparison(
  angleImages: AngleImages[],
  existingDamageNotes: string,
  checkinNotes: string
): Promise<AiReviewData> {
  // Build message content: text description + image pairs
  const content: unknown[] = [];

  let contextText = 'Compare the CHECK-OUT and CHECK-IN photos for each vehicle angle below.';
  if (existingDamageNotes.trim()) {
    contextText += `\n\nPRE-EXISTING DAMAGE noted at checkout (do NOT flag these as new): ${existingDamageNotes}`;
  }
  if (checkinNotes.trim()) {
    contextText += `\n\nCUSTOMER COMMENTS at return: ${checkinNotes}`;
  }
  content.push({ type: 'text', text: contextText });

  // Add each angle pair (resize first to keep payload small)
  const validAngles = angleImages.filter(a => a.checkout || a.checkin);
  for (const { angle, checkout, checkin } of validAngles) {
    content.push({ type: 'text', text: `\n=== ${angle.toUpperCase()} ===` });

    if (checkout) {
      const resized = await resizeImage(checkout);
      content.push({ type: 'text', text: 'CHECK-OUT:' });
      content.push({ type: 'image_url', image_url: { url: resized, detail: 'low' } });
    } else {
      content.push({ type: 'text', text: 'CHECK-OUT: not available' });
    }

    if (checkin) {
      const resized = await resizeImage(checkin);
      content.push({ type: 'text', text: 'CHECK-IN:' });
      content.push({ type: 'image_url', image_url: { url: resized, detail: 'low' } });
    } else {
      content.push({ type: 'text', text: 'CHECK-IN: not available' });
    }
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

  const parsed = JSON.parse(raw);
  return normalizeResponse(parsed);
}

// Ensure the parsed response matches AiReviewData shape even if OpenAI drifts
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
