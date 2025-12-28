# Granular Step Tracking System

## Overview

The OnSpace AI app now features an **ultra-sophisticated granular step tracking system** that provides unprecedented visibility into the booking process. Users can see detailed, real-time progress as the AI agent works through each phase of booking flights, rides, or doctor appointments.

## Architecture

### Core Components

#### 1. **Type Definitions** (`types/index.ts`)

- **`StepStatus`**: `'pending' | 'active' | 'completed' | 'failed' | 'skipped'`
- **`FlightBookingStep`**: 31 granular steps for flight bookings
- **`RideBookingStep`**: 19 granular steps for ride bookings
- **`DoctorBookingStep`**: 24 granular steps for doctor appointments
- **`GranularStep`**: Union type of all booking steps
- **`StepMetadata`**: Complete step information including status, timing, progress, and visual properties

#### 2. **Step Definitions** (`constants/granularSteps.ts`)

Comprehensive step flows for each booking type:

**Flight Booking (31 steps)**:
- **Planning Phase** (10 steps): API connection, authentication, location detection, intent parsing, origin/destination extraction, date validation, budget analysis, cabin class, traveler count
- **Search Phase** (6 steps): Flight API query, data fetching, filtering, preference application, duration calculation
- **Compare Phase** (4 steps): Price comparison, ranking, availability check, seat verification
- **Booking Phase** (11 steps): Selection, hold, seat assignment, passenger info, passport validation, payment, confirmation, PNR generation, email, calendar, monitoring

**Ride Booking (19 steps)**:
- Location detection, destination parsing, address validation
- Uber/Lyft API connections
- Driver search, route calculation, duration estimation
- Price estimates, provider comparison, vehicle selection
- Driver availability, ride request, driver matching
- Pickup confirmation, tracking, payment, details, live tracking

**Doctor Appointment (24 steps)**:
- Symptom parsing, specialty identification, urgency determination
- Location detection, search radius
- Insurance verification, coverage check
- Provider search, specialty filtering, ratings check, credential verification
- Availability check, appointment slot finding
- Doctor comparison, ranking
- Selection, appointment type, time slot, insurance re-verification
- Booking, confirmation, calendar, reminder, pre-appointment info

#### 3. **UI Components**

**`GranularStepProgress`** (`components/feature/GranularStepProgress.tsx`):
- **Full-screen cinematic step visualization** - each step takes over the entire screen
- **Scene-based transitions** - steps animate in/out like cinematic scenes
- Advanced animations: pulse, rotating rings, shimmer effects
- **Single-step-at-a-time display** - no scrolling, just immersive full-screen scenes
- Dynamic background gradients based on booking type
- Real-time progress indicators and step details
- Smooth fade/scale/slide transitions between steps

**`MiniStepIndicator`** (`components/feature/MiniStepIndicator.tsx`):
- Compact progress indicator for main screen
- Animated icon with rotating ring
- Current step label and description
- Overall progress bar
- Step counter (completed/total)
- Tap to expand to full modal

**`GranularStepModal`** (`components/feature/GranularStepModal.tsx`):
- Full-screen modal with slide-up animation
- Blur backdrop
- Drag handle for dismissal
- Hosts `GranularStepProgress` component

#### 4. **Services**

**`granularAgentService.ts`** (`services/granularAgentService.ts`):
- Enhanced booking service with granular step tracking
- `planGranularBooking()`: Main function for booking with step callbacks
- Configurable step delays (fast: 800ms, normal: 1500ms, slow: 2500ms)
- Real-time step updates via callback
- Comprehensive error handling with step-level failure tracking
- Support for all three booking types

#### 5. **Hooks**

**`useGranularSteps`** (`hooks/useGranularSteps.ts`):
- State management for granular steps
- `initializeForBookingType()`: Initialize steps for a booking type
- `handleStepChange()`: Update step state from callbacks
- `reset()`: Clear step state
- `complete()`: Mark all steps as complete
- Tracks: steps, currentStep, progress, completedCount, totalCount, isActive

### Data Flow

```
User Input
    ↓
HomeScreen detects booking type
    ↓
Initialize granular steps (useGranularSteps)
    ↓
Show MiniStepIndicator
    ↓
Call planGranularBooking() with onStepChange callback
    ↓
Service executes steps sequentially:
    - Update step to 'active'
    - Perform operation (API call, validation, etc.)
    - Update step to 'completed' with details
    - Trigger callback → Update UI
    ↓
User can tap MiniStepIndicator to open GranularStepModal
    ↓
Full-screen progress with animations
    ↓
On completion: Show proposal
```

## Usage

### Basic Integration

```typescript
import { useGranularSteps } from '@/hooks/useGranularSteps';
import { planGranularBooking } from '@/services/granularAgentService';
import { MiniStepIndicator } from '@/components/feature/MiniStepIndicator';
import { GranularStepModal } from '@/components/feature/GranularStepModal';

function MyComponent() {
  const { stepState, initializeForBookingType, handleStepChange, reset } = useGranularSteps();
  const [showModal, setShowModal] = useState(false);

  const handleBooking = async (input: string, bookingType: 'flight' | 'ride' | 'doctor') => {
    // Initialize steps
    initializeForBookingType(bookingType);
    
    // Call booking service
    const response = await planGranularBooking({
      userMessage: input,
      bookingType,
      onStepChange: handleStepChange,
    });
    
    // Handle response
    if (response.success) {
      // Show proposal
    }
  };

  return (
    <>
      {/* Mini indicator */}
      {stepState.isActive && (
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <MiniStepIndicator
            currentStep={stepState.currentStep}
            progress={stepState.progress}
            totalSteps={stepState.totalCount}
            completedSteps={stepState.completedCount}
          />
        </TouchableOpacity>
      )}

      {/* Full modal */}
      <GranularStepModal
        visible={showModal}
        steps={stepState.steps}
        currentStep={stepState.currentStep}
        progress={stepState.progress}
        bookingType={bookingType}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
```

## Animation Features

### Step Animations
- **Pulse**: Active steps pulse gently (1.0 → 1.08 scale)
- **Rotating Ring**: Dashed ring rotates around active step icon
- **Shimmer**: Progress bars have shimmer effect
- **Particle Explosion**: Celebration particles on step completion
- **Auto-scroll**: Automatically scrolls to current step

### Timing
- **Fast steps** (800ms): Validation, parsing, simple operations
- **Normal steps** (1500ms): API calls, standard operations
- **Slow steps** (2500ms): Complex searches, comparisons

## Customization

### Adding New Steps

1. Add step to type enum in `types/index.ts`:
```typescript
export type FlightBookingStep =
  | 'existing_steps'
  | 'my_new_step';
```

2. Add step definition in `constants/granularSteps.ts`:
```typescript
{
  id: 'my_new_step',
  step: 'my_new_step' as FlightBookingStep,
  phase: 'search',
  label: 'My New Step',
  description: 'Doing something amazing...',
  status: 'pending',
  icon: 'sparkles-outline',
  color: '#3B82F6',
  accentColor: '#60A5FA',
}
```

3. Execute step in `services/granularAgentService.ts`:
```typescript
steps = await executeStep(steps, 'my_new_step', 'active', onStepChange);
// ... perform operation ...
steps = await executeStep(steps, 'my_new_step', 'completed', onStepChange, {
  primary: 'Operation complete',
  items: [{ label: 'Result', value: 'Success', icon: 'checkmark' }],
});
```

## Performance Considerations

- Steps are executed sequentially with configurable delays
- Animations use `useNativeDriver` where possible for 60fps
- Particle system limited to 20 particles for performance
- Auto-scroll uses animated scrolling for smooth UX
- Modal uses slide-up animation with blur backdrop

## Future Enhancements

- [ ] Streaming step updates from edge function
- [ ] Step-level retry mechanism
- [ ] Parallel step execution for independent operations
- [ ] Step history and replay
- [ ] Analytics tracking for step completion times
- [ ] A/B testing different step sequences
- [ ] Voice narration of current step
- [ ] Haptic feedback on step transitions

