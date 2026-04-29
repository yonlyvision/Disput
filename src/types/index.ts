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

export type FinalDecision = 'Approve Return' | 'Manual Review' | 'Charge Damage Fee';
