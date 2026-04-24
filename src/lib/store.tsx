import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { Rental, RentalStatus, FinalDecision } from '../types';
import { mockRentals, mockAiResponses, mockVehicles, mockUsers } from './mockData';

// ── State Shape ──────────────────────────────────────────────

export interface InspectionData {
  images: Record<string, string>; // angle → base64 data URL
  notes: string;
  completedAt?: string;
  customerSignature?: string; // base64 PNG of customer's drawn signature
  signedByName?: string;      // customer-typed name at time of signing
}

export interface AiReviewData {
  summary: {
    new_damage_detected: boolean;
    overall_confidence: number;
    inspection_result: string;
  };
  damages: Array<{
    panel_or_area: string;
    side: string;
    damage_type: string;
    severity: string;
    confidence: number;
    status: string;
    description: string;
    reasoning: string;
  }>;
  unreviewable_areas: Array<{
    panel_or_area: string;
    reason: string;
  }>;
  recommended_action: string;
}

export interface FinalReviewData {
  decision: FinalDecision;
  notes: string;
  reviewer: string;
  timestamp: string;
}

export interface AppState {
  rentals: Rental[];
  inspections: Record<string, { checkout?: InspectionData; checkin?: InspectionData }>;
  aiResults: Record<string, AiReviewData>;
  finalReviews: Record<string, FinalReviewData>;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
}

// ── Actions ──────────────────────────────────────────────────

type Action =
  | { type: 'CREATE_RENTAL'; payload: Rental }
  | { type: 'UPDATE_RENTAL_STATUS'; payload: { rentalId: string; status: RentalStatus } }
  | { type: 'SAVE_CHECKOUT'; payload: { rentalId: string; data: InspectionData } }
  | { type: 'SAVE_CHECKIN'; payload: { rentalId: string; data: InspectionData } }
  | { type: 'SAVE_AI_RESULT'; payload: { rentalId: string; data: AiReviewData } }
  | { type: 'SAVE_FINAL_REVIEW'; payload: { rentalId: string; data: FinalReviewData } }
  | { type: 'SHOW_TOAST'; payload: { message: string; type: 'success' | 'error' | 'info' } }
  | { type: 'CLEAR_TOAST' }
  | { type: 'RESET_STATE' };

// ── Reducer ──────────────────────────────────────────────────

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'CREATE_RENTAL':
      return { ...state, rentals: [...state.rentals, action.payload] };

    case 'UPDATE_RENTAL_STATUS':
      return {
        ...state,
        rentals: state.rentals.map(r =>
          r.id === action.payload.rentalId ? { ...r, status: action.payload.status } : r
        ),
      };

    case 'SAVE_CHECKOUT':
      return {
        ...state,
        inspections: {
          ...state.inspections,
          [action.payload.rentalId]: {
            ...state.inspections[action.payload.rentalId],
            checkout: action.payload.data,
          },
        },
      };

    case 'SAVE_CHECKIN':
      return {
        ...state,
        inspections: {
          ...state.inspections,
          [action.payload.rentalId]: {
            ...state.inspections[action.payload.rentalId],
            checkin: action.payload.data,
          },
        },
      };

    case 'SAVE_AI_RESULT':
      return {
        ...state,
        aiResults: { ...state.aiResults, [action.payload.rentalId]: action.payload.data },
      };

    case 'SAVE_FINAL_REVIEW':
      return {
        ...state,
        finalReviews: { ...state.finalReviews, [action.payload.rentalId]: action.payload.data },
      };

    case 'SHOW_TOAST':
      return { ...state, toast: action.payload };

    case 'CLEAR_TOAST':
      return { ...state, toast: null };

    case 'RESET_STATE':
      localStorage.removeItem(STORAGE_KEY);
      return {
        rentals: [...mockRentals],
        inspections: {},
        aiResults: {
          r1: mockAiResponses.noDamage as AiReviewData,
          r2: mockAiResponses.possibleDamage as AiReviewData,
        },
        finalReviews: {
          r1: {
            decision: 'Approve Return',
            notes: 'Vehicle returned in excellent condition. No damage found.',
            reviewer: 'John Doe',
            timestamp: '2026-04-22T10:00:00Z',
          },
        },
        toast: { message: 'System data has been reset to defaults.', type: 'info' },
      };

    default:
      return state;
  }
}

// ── Persistence ──────────────────────────────────────────────

const STORAGE_KEY = 'rental_inspection_state';

const loadState = (): AppState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Basic validation to ensure schema matches
      if (parsed.rentals && parsed.inspections) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load state from localStorage', e);
  }
  return {
    rentals: [...mockRentals],
    inspections: {},
    aiResults: {
      r1: mockAiResponses.noDamage as AiReviewData,
      r2: mockAiResponses.possibleDamage as AiReviewData,
    },
    finalReviews: {
      r1: {
        decision: 'Approve Return',
        notes: 'Vehicle returned in excellent condition. No damage found.',
        reviewer: 'John Doe',
        timestamp: '2026-04-22T10:00:00Z',
      },
    },
    toast: null,
  };
};

const initialState: AppState = loadState();

// ── Context ──────────────────────────────────────────────────

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => {} });

export const useAppState = () => useContext(AppContext);

// ── Helper hooks ─────────────────────────────────────────────

export const useRental = (id: string | undefined) => {
  const { state } = useAppState();
  return state.rentals.find(r => r.id === id);
};

export const useToast = () => {
  const { state, dispatch } = useAppState();

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
  };

  const clearToast = () => {
    dispatch({ type: 'CLEAR_TOAST' });
  };

  return { toast: state.toast, showToast, clearToast };
};

// Helper to pick a mock AI response based on rental ID for variety
export function pickMockAiResponse(rentalId: string, forcedType?: 'none' | 'possible' | 'clear'): AiReviewData {
  if (forcedType === 'none') return mockAiResponses.noDamage as AiReviewData;
  if (forcedType === 'possible') return mockAiResponses.possibleDamage as AiReviewData;
  if (forcedType === 'clear') return mockAiResponses.clearDamage as AiReviewData;

  const hash = rentalId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const options = [mockAiResponses.noDamage, mockAiResponses.possibleDamage, mockAiResponses.clearDamage];
  return options[hash % options.length] as AiReviewData;
}

// Helper to generate a unique rental ID
let rentalCounter = 100;
export function generateRentalId(): string {
  rentalCounter++;
  return `r${rentalCounter}`;
}

export { mockVehicles, mockUsers };

// ── Provider ─────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Auto-dismiss toasts after 3 seconds
  useEffect(() => {
    if (state.toast) {
      const timer = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.toast]);

  // Persist state to localStorage
  useEffect(() => {
    try {
      // Don't persist the toast
      const { toast, ...persistentState } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentState));
    } catch (e) {
      console.warn('Failed to save state to localStorage (likely quota limit)', e);
    }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
      {/* Toast UI */}
      {state.toast && (
        <div
          onClick={() => dispatch({ type: 'CLEAR_TOAST' })}
          style={{
            position: 'fixed',
            bottom: 'var(--spacing-6)',
            right: 'var(--spacing-6)',
            padding: 'var(--spacing-3) var(--spacing-6)',
            borderRadius: 'var(--radius-lg)',
            color: 'white',
            fontWeight: 'var(--font-medium)',
            fontSize: 'var(--text-sm)',
            zIndex: 10000,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-lg)',
            animation: 'fadeIn 0.3s ease-out',
            backgroundColor:
              state.toast.type === 'success' ? 'var(--success)' :
              state.toast.type === 'error' ? 'var(--danger)' : 'var(--brand-primary)',
          }}
        >
          {state.toast.message}
        </div>
      )}
    </AppContext.Provider>
  );
};
