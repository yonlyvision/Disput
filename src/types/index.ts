export type UserRole = 'staff' | 'manager' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number;
}

export type RentalStatus = 
  | 'Draft' 
  | 'Check-Out Completed' 
  | 'Awaiting Return' 
  | 'Check-In Submitted' 
  | 'AI Review Ready' 
  | 'Manual Review Needed' 
  | 'Completed';

export interface Rental {
  id: string;
  vehicle_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  staff_id: string;
  status: RentalStatus;
  start_date: string;
  expected_return_date: string;
  actual_return_date?: string;
  created_at: string;
  
  // Relations
  vehicle?: Vehicle;
  staff?: User;
}

export type InspectionType = 'checkout' | 'checkin';

export interface Inspection {
  id: string;
  rental_id: string;
  type: InspectionType;
  staff_id: string;
  created_at: string;
  existing_damage_notes?: string;
  customer_comments?: string;
  visible_issue_notes?: string;
}

export type VehicleAngle = 
  | 'Front' 
  | 'Front-Left' 
  | 'Left Side' 
  | 'Rear-Left' 
  | 'Rear' 
  | 'Rear-Right' 
  | 'Right Side' 
  | 'Front-Right'
  | 'Close-up';

export interface InspectionImage {
  id: string;
  inspection_id: string;
  angle: VehicleAngle;
  image_url: string; // URL or base64 in mock
  notes?: string;
  created_at: string;
}

export type AiResultStatus = 'pass' | 'review' | 'fail';

export interface AiResult {
  id: string;
  rental_id: string;
  checkin_inspection_id: string;
  checkout_inspection_id: string;
  new_damage_detected: boolean;
  overall_confidence: number;
  inspection_result: AiResultStatus;
  raw_json: string;
  created_at: string;
}

export interface AiDamage {
  id: string;
  ai_result_id: string;
  panel_or_area: string;
  side: string;
  damage_type: string;
  severity: string;
  confidence: number;
  status: string;
  description: string;
  reasoning: string;
}

export type FinalDecision = 'Approve Return' | 'Manual Review' | 'Charge Damage Fee';

export interface FinalReview {
  id: string;
  rental_id: string;
  ai_result_id: string;
  staff_id: string;
  decision: FinalDecision;
  notes?: string;
  created_at: string;
}
