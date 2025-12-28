# Granular Steps - Quick Reference Card

## 📦 Files Created

```
components/feature/
├── GranularStepProgress.tsx    (705 lines) - Full step visualization
├── MiniStepIndicator.tsx       (218 lines) - Compact indicator
└── GranularStepModal.tsx       (165 lines) - Full-screen modal

hooks/
└── useGranularSteps.ts         (93 lines)  - State management

services/
└── granularAgentService.ts     (364 lines) - Booking service

constants/
└── granularSteps.ts            (1003 lines) - Step definitions

docs/
├── GRANULAR_STEPS.md           - System documentation
├── INTEGRATION_GUIDE.md        - Developer guide
├── IMPLEMENTATION_SUMMARY.md   - Implementation details
├── VISUAL_SHOWCASE.md          - Visual examples
└── QUICK_REFERENCE.md          - This file
```

## 🔢 Step Counts

| Booking Type | Planning | Search | Compare | Booking | **Total** |
|--------------|----------|--------|---------|---------|-----------|
| Flight ✈️    | 10       | 6      | 4       | 11      | **31**    |
| Ride 🚗      | 5        | 6      | -       | 8       | **19**    |
| Doctor 🏥    | 5        | 6      | 4       | 9       | **24**    |

## 🎨 Component Props

### MiniStepIndicator
```typescript
<MiniStepIndicator
  currentStep={StepMetadata | null}
  progress={number}              // 0-100
  totalSteps={number}
  completedSteps={number}
/>
```

### GranularStepModal
```typescript
<GranularStepModal
  visible={boolean}
  steps={StepMetadata[]}
  currentStep={StepMetadata | null}
  progress={number}              // 0-100
  bookingType={'flight' | 'ride' | 'doctor'}
  onClose={() => void}
  onStepComplete={(step) => void}
/>
```

### GranularStepProgress
```typescript
<GranularStepProgress
  steps={StepMetadata[]}
  currentStep={StepMetadata | null}
  progress={number}              // 0-100
  bookingType={'flight' | 'ride' | 'doctor'}
  onStepComplete={(step) => void}
/>
```

## 🪝 Hook Usage

```typescript
const {
  stepState: {
    steps,           // StepMetadata[]
    currentStep,     // StepMetadata | null
    progress,        // number (0-100)
    completedCount,  // number
    totalCount,      // number
    isActive,        // boolean
  },
  initializeForBookingType,  // (type) => void
  handleStepChange,          // (step, steps, progress) => void
  reset,                     // () => void
  complete,                  // () => void
} = useGranularSteps();
```

## 🔧 Service API

```typescript
const response = await planGranularBooking({
  userMessage: string,
  bookingType: 'flight' | 'ride' | 'doctor',
  currentLocation?: {
    latitude: number,
    longitude: number,
    city?: string,
    nearestAirport?: string,
  },
  onStepChange?: (
    currentStep: StepMetadata | null,
    allSteps: StepMetadata[],
    progress: number
  ) => void,
});

// Response:
{
  success: boolean,
  bookingId: string,
  agentRunId?: string,
  bookingType: 'flight' | 'ride' | 'doctor',
  steps: StepMetadata[],
  intent: any,
  options?: any[],
  proposal: any,
  error?: string,
}
```

## 📊 StepMetadata Interface

```typescript
interface StepMetadata {
  id: string;
  step: GranularStep;
  phase: ExecutionPhase;
  label: string;
  description: string;
  status: StepStatus;
  icon: string;                    // Ionicon name
  color: string;                   // Hex color
  accentColor: string;             // Hex color
  progress?: number;               // 0-100
  startTime?: number;              // Timestamp
  endTime?: number;                // Timestamp
  duration?: number;               // Milliseconds
  details?: {
    primary?: string;
    secondary?: string;
    items?: Array<{
      label: string;
      value: string;
      icon?: string;
    }>;
  };
  error?: string;
}
```

## ⏱️ Step Delays

```typescript
const STEP_DELAYS = {
  fast: 800,      // Validation, parsing
  normal: 1500,   // API calls, standard ops
  slow: 2500,     // Complex searches, comparisons
};
```

## 🎯 Helper Functions

```typescript
// Get all steps for a booking type
getAllStepsForBookingType(type: 'flight' | 'ride' | 'doctor'): StepMetadata[]

// Get steps for a specific phase
getStepsForPhase(type, phase: ExecutionPhase): StepMetadata[]

// Initialize fresh steps
initializeSteps(steps: StepMetadata[]): StepMetadata[]

// Update step status
updateStepStatus(
  steps: StepMetadata[],
  stepId: string,
  status: StepStatus,
  details?: any
): StepMetadata[]

// Calculate overall progress
calculateOverallProgress(steps: StepMetadata[]): number

// Get current active step
getCurrentStep(steps: StepMetadata[]): StepMetadata | null

// Get next pending step
getNextPendingStep(steps: StepMetadata[]): StepMetadata | null
```

## 🎨 Animation Timings

| Animation | Duration | Easing |
|-----------|----------|--------|
| Entrance | 600ms | Spring |
| Pulse | 1200ms | Ease-in-out |
| Rotation | 3000ms | Linear |
| Shimmer | 2000ms | Linear |
| Particles | 800-1200ms | Ease-out |
| Auto-scroll | 300ms | Ease-in-out |

## 🎨 Color Codes

### Flight ✈️
- Primary: `#3B82F6` (Blue)
- Accent: `#60A5FA` (Light Blue)

### Ride 🚗
- Primary: `#000000` (Black)
- Accent: `#FF00BF` (Pink)

### Doctor 🏥
- Primary: `#EF4444` (Red)
- Accent: `#3B82F6` (Blue)

### Status
- Pending: `#6B7280` (Gray)
- Active: Booking type color
- Completed: `#10B981` (Green)
- Failed: `#EF4444` (Red)
- Skipped: `#F59E0B` (Orange)

## 🚀 Quick Start

```typescript
// 1. Import
import { useGranularSteps } from '@/hooks/useGranularSteps';
import { planGranularBooking } from '@/services/granularAgentService';
import { MiniStepIndicator } from '@/components/feature/MiniStepIndicator';
import { GranularStepModal } from '@/components/feature/GranularStepModal';

// 2. Setup
const { stepState, initializeForBookingType, handleStepChange } = useGranularSteps();
const [showModal, setShowModal] = useState(false);

// 3. Initialize
initializeForBookingType('flight');

// 4. Execute
const response = await planGranularBooking({
  userMessage: "Book a flight to Tokyo",
  bookingType: 'flight',
  onStepChange: handleStepChange,
});

// 5. Render
<MiniStepIndicator {...stepState} />
<GranularStepModal visible={showModal} {...stepState} />
```

## 🐛 Debugging

```typescript
// Log step changes
onStepChange: (step, steps, progress) => {
  console.log('Current:', step?.label);
  console.log('Progress:', progress + '%');
  console.log('Completed:', steps.filter(s => s.status === 'completed').length);
}

// Check step state
console.log('Active:', stepState.isActive);
console.log('Current:', stepState.currentStep?.label);
console.log('Progress:', stepState.progress);
```

## 📱 Testing Commands

```bash
# Start dev server
pnpm start

# Run on iOS
pnpm run ios

# Run on Android
pnpm run android

# Lint
pnpm run lint
```

## 🔗 Related Files

- Main integration: `app/(tabs)/index.tsx`
- Type definitions: `types/index.ts`
- Theme constants: `constants/theme.ts`
- Existing agent service: `services/agentService.ts`
- Existing chat hook: `hooks/useAgentChat.ts`

## 💡 Tips

1. **Toggle flows**: Set `useGranularFlow` to switch between granular and cinematic
2. **Adjust delays**: Modify `STEP_DELAYS` for faster/slower execution
3. **Customize colors**: Edit step definitions in `constants/granularSteps.ts`
4. **Add steps**: Follow the pattern in existing step arrays
5. **Debug**: Use `onStepChange` callback to log progress
6. **Performance**: Reduce particle count if animations lag
7. **Accessibility**: Ensure sufficient color contrast

## 📚 Documentation

- **GRANULAR_STEPS.md**: Full system documentation
- **INTEGRATION_GUIDE.md**: Integration instructions
- **IMPLEMENTATION_SUMMARY.md**: Implementation details
- **VISUAL_SHOWCASE.md**: Visual examples and animations
- **QUICK_REFERENCE.md**: This quick reference

## ✅ Checklist

- [x] Types defined in `types/index.ts`
- [x] Steps defined in `constants/granularSteps.ts`
- [x] Components created (3 files)
- [x] Hook created (`useGranularSteps`)
- [x] Service created (`granularAgentService`)
- [x] Integrated into `HomeScreen`
- [x] Documentation complete
- [x] No TypeScript errors
- [x] Animations smooth
- [x] All booking types supported

