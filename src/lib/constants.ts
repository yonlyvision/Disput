import type { VehicleAngle } from '../types';

export const REQUIRED_ANGLES: { angle: VehicleAngle; guidance: string }[] = [
  { angle: 'Front', guidance: 'Capture the entire front bumper, grille, and headlights.' },
  { angle: 'Front-Left', guidance: 'Include the front left wheel and fender.' },
  { angle: 'Left Side', guidance: 'Capture both doors and the full length of the left side.' },
  { angle: 'Rear-Left', guidance: 'Include the rear left wheel and quarter panel.' },
  { angle: 'Rear', guidance: 'Capture the entire rear bumper, trunk, and taillights.' },
  { angle: 'Rear-Right', guidance: 'Include the rear right wheel and quarter panel.' },
  { angle: 'Right Side', guidance: 'Capture both doors and the full length of the right side.' },
  { angle: 'Front-Right', guidance: 'Include the front right wheel and fender.' },
];
