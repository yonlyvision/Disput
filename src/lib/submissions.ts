import { supabase } from './supabase';

export interface CustomerSubmission {
  id: string;
  rental_id: string;
  images: Record<string, string>; // frame_0, frame_1, ... → base64
  notes: string;
  submitted_by: string;
  submitted_at: string;
  status: 'pending' | 'imported';
}

// Resize to 600px max before storing — keeps rows lean
async function resizeForStorage(dataUrl: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 600 / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function submitCustomerPhotos(
  rentalId: string,
  images: Record<string, string>,
  notes: string,
  submittedBy: string = 'customer'
): Promise<{ ok: boolean; error?: string }> {
  // Resize all images before storing
  const resized: Record<string, string> = {};
  for (const [angle, dataUrl] of Object.entries(images)) {
    resized[angle] = await resizeForStorage(dataUrl);
  }

  const { error } = await supabase.from('customer_submissions').insert({
    rental_id: rentalId,
    images: resized,
    notes,
    submitted_by: submittedBy,
    submitted_at: new Date().toISOString(),
    status: 'pending',
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function fetchSubmissionsForRental(rentalId: string): Promise<CustomerSubmission[]> {
  const { data, error } = await supabase
    .from('customer_submissions')
    .select('*')
    .eq('rental_id', rentalId)
    .order('submitted_at', { ascending: false });

  if (error || !data) return [];
  return data as CustomerSubmission[];
}

export async function fetchAllPendingSubmissions(): Promise<CustomerSubmission[]> {
  const { data, error } = await supabase
    .from('customer_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false });

  if (error || !data) return [];
  return data as CustomerSubmission[];
}

export async function markSubmissionImported(submissionId: string): Promise<void> {
  await supabase
    .from('customer_submissions')
    .update({ status: 'imported' })
    .eq('id', submissionId);
}

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return !!url && url !== 'http://localhost:54321';
}
