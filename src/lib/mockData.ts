import type { Rental, Vehicle, User } from '../types';

export const mockVehicles: Vehicle[] = [
  { id: 'v1', plate_number: 'ABC-1234', make: 'Toyota', model: 'Camry', year: 2023 },
  { id: 'v2', plate_number: 'XYZ-9876', make: 'Honda', model: 'Civic', year: 2024 },
  { id: 'v3', plate_number: 'LMN-4567', make: 'Ford', model: 'Mustang', year: 2022 },
];

export const mockUsers: User[] = [
  { id: 'u1', email: 'staff@example.com', role: 'staff', full_name: 'John Doe' }
];

export const mockRentals: Rental[] = [
  {
    id: 'r1',
    vehicle_id: 'v1',
    customer_name: 'Alice Smith',
    customer_phone: '555-0101',
    staff_id: 'u1',
    status: 'Completed',
    start_date: '2026-04-20T10:00:00Z',
    expected_return_date: '2026-04-22T10:00:00Z',
    actual_return_date: '2026-04-22T09:30:00Z',
    created_at: '2026-04-20T09:50:00Z',
    vehicle: mockVehicles[0],
    staff: mockUsers[0],
  },
  {
    id: 'r2',
    vehicle_id: 'v2',
    customer_name: 'Bob Johnson',
    customer_phone: '555-0202',
    staff_id: 'u1',
    status: 'AI Review Ready', // Possible new scratch case
    start_date: '2026-04-21T14:00:00Z',
    expected_return_date: '2026-04-23T14:00:00Z',
    actual_return_date: '2026-04-23T15:15:00Z',
    created_at: '2026-04-21T13:45:00Z',
    vehicle: mockVehicles[1],
    staff: mockUsers[0],
  },
  {
    id: 'r3',
    vehicle_id: 'v3',
    customer_name: 'Charlie Davis',
    customer_phone: '555-0303',
    staff_id: 'u1',
    status: 'Check-Out Completed', // Awaiting Return essentially
    start_date: '2026-04-23T09:00:00Z',
    expected_return_date: '2026-04-25T09:00:00Z',
    created_at: '2026-04-23T08:50:00Z',
    vehicle: mockVehicles[2],
    staff: mockUsers[0],
  }
];

export const mockAiResponses = {
  noDamage: {
    summary: {
      new_damage_detected: false,
      overall_confidence: 95,
      inspection_result: "pass"
    },
    damages: [],
    unreviewable_areas: [],
    recommended_action: "approve_return"
  },
  possibleDamage: {
    summary: {
      new_damage_detected: true,
      overall_confidence: 86,
      inspection_result: "review"
    },
    damages: [
      {
        panel_or_area: "rear bumper",
        side: "rear-right",
        damage_type: "scratch",
        severity: "minor",
        confidence: 88,
        status: "new_damage",
        description: "A horizontal scratch is visible on the rear-right section of the bumper in the check-in image but is not visible in the check-out image.",
        reasoning: "The mark appears consistent across multiple return images and does not match reflections or dirt."
      }
    ],
    unreviewable_areas: [
      {
        panel_or_area: "left rear door lower section",
        reason: "Area too dark in check-out image for reliable comparison."
      }
    ],
    recommended_action: "manual_review"
  },
  clearDamage: {
    summary: {
      new_damage_detected: true,
      overall_confidence: 98,
      inspection_result: "fail"
    },
    damages: [
      {
        panel_or_area: "front bumper",
        side: "front-left",
        damage_type: "dent",
        severity: "major",
        confidence: 99,
        status: "new_damage",
        description: "Large dent on the front-left bumper, clear structural deformation.",
        reasoning: "Panel shape is significantly altered compared to checkout state."
      }
    ],
    unreviewable_areas: [],
    recommended_action: "charge_damage_fee"
  }
};
