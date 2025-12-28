# Granular Step System - Integration Guide

## Quick Start

The granular step tracking system is now integrated into the OnSpace AI app. Here's how to use it:

### Toggle Between Cinematic and Granular Flows

In `app/(tabs)/index.tsx`, there's a toggle:

```typescript
const [useGranularFlow, setUseGranularFlow] = useState(true);
```

- **`true`**: Uses the new granular step system with ultra-detailed progress
- **`false`**: Uses the original cinematic scene system

### User Experience Flow

1. **User speaks or types a booking request**
   - "Book me a flight to Tokyo"
   - "Get me a ride to the airport"
   - "Find me a doctor appointment"

2. **System detects booking type automatically**
   - Flight: Keywords like "flight", "fly", "trip"
   - Ride: Keywords like "ride", "uber", "lyft", "taxi"
   - Doctor: Keywords like "doctor", "appointment", "medical"

3. **Granular steps initialize**
   - 31 steps for flights
   - 19 steps for rides
   - 24 steps for doctor appointments

4. **Mini indicator appears**
   - Shows current step with animated icon
   - Displays progress percentage
   - Shows completed/total step count
   - User can tap to expand to full modal

5. **Full modal (optional)**
   - Slide-up animation
   - Complete step list with status
   - Real-time progress bars
   - Particle celebrations on completion
   - Auto-scrolls to current step

6. **Completion**
   - All steps marked complete
   - Proposal displayed
   - User can approve or adjust

## Component Hierarchy

```
HomeScreen
├── MiniStepIndicator (during planning)
│   ├── Animated icon with rotating ring
│   ├── Step label and description
│   ├── Progress bar
│   └── Step counter
│
└── GranularStepModal (on tap)
    └── GranularStepProgress
        ├── Header with booking type
        ├── Overall progress bar
        ├── Step list (scrollable)
        │   ├── Step icon (pending/active/completed/failed)
        │   ├── Step label and description
        │   ├── Progress bar (for active steps)
        │   ├── Details (for active steps)
        │   └── Duration (for completed steps)
        └── Particle system (celebrations)
```

## API Reference

### `useGranularSteps` Hook

```typescript
const {
  stepState,           // Current state of all steps
  initializeForBookingType,  // Initialize steps for a booking type
  handleStepChange,    // Callback for step updates
  reset,               // Reset all steps
  complete,            // Mark all as complete
} = useGranularSteps();

// stepState structure:
{
  steps: StepMetadata[],      // All steps
  currentStep: StepMetadata | null,  // Currently active step
  progress: number,           // Overall progress (0-100)
  completedCount: number,     // Number of completed steps
  totalCount: number,         // Total number of steps
  isActive: boolean,          // Whether steps are being executed
}
```

### `planGranularBooking` Service

```typescript
const response = await planGranularBooking({
  userMessage: string,        // User's booking request
  bookingType: 'flight' | 'ride' | 'doctor',
  currentLocation?: {         // Optional GPS location
    latitude: number,
    longitude: number,
    city?: string,
    nearestAirport?: string,
  },
  onStepChange?: (            // Callback for step updates
    currentStep: StepMetadata | null,
    allSteps: StepMetadata[],
    progress: number
  ) => void,
});

// Response structure:
{
  success: boolean,
  bookingId: string,
  agentRunId?: string,
  bookingType: 'flight' | 'ride' | 'doctor',
  steps: StepMetadata[],
  intent: any,                // Parsed booking intent
  options?: any[],            // Available options (flights/rides/doctors)
  proposal: any,              // Booking proposal
  error?: string,
}
```

## Customization Examples

### Change Step Delays

In `services/granularAgentService.ts`:

```typescript
const STEP_DELAYS = {
  fast: 800,      // Quick operations
  normal: 1500,   // Standard operations
  slow: 2500,     // Complex operations
};
```

### Add Custom Step Details

```typescript
steps = await executeStep(steps, 'my_step', 'completed', onStepChange, {
  primary: 'Main message',
  items: [
    { label: 'Detail 1', value: 'Value 1', icon: 'checkmark' },
    { label: 'Detail 2', value: 'Value 2', icon: 'star' },
  ],
});
```

### Customize Step Colors

In `constants/granularSteps.ts`:

```typescript
{
  id: 'my_step',
  // ... other properties
  color: '#FF6B6B',        // Main color
  accentColor: '#FF8E8E',  // Lighter accent
}
```

## Testing

### Manual Testing

1. **Start the app**: `pnpm start`
2. **Navigate to home screen**
3. **Tap the agent disk** or use text input
4. **Enter a booking request**:
   - "Book a flight to Paris"
   - "Get me a ride to downtown"
   - "Find a doctor for a checkup"
5. **Observe the mini step indicator**
6. **Tap the indicator** to open full modal
7. **Watch the step progression**
8. **Verify animations** are smooth
9. **Check proposal** appears after completion

### Automated Testing (Future)

```typescript
// Example test structure
describe('Granular Steps', () => {
  it('should initialize steps for flight booking', () => {
    const steps = getAllStepsForBookingType('flight');
    expect(steps).toHaveLength(31);
  });

  it('should update step status correctly', () => {
    const steps = initializeSteps([...]);
    const updated = updateStepStatus(steps, 'step_id', 'completed');
    expect(updated.find(s => s.id === 'step_id').status).toBe('completed');
  });

  it('should calculate overall progress', () => {
    const steps = [...]; // 10 steps, 5 completed
    const progress = calculateOverallProgress(steps);
    expect(progress).toBe(50);
  });
});
```

## Troubleshooting

### Steps not appearing
- Check `useGranularFlow` is set to `true`
- Verify `initializeForBookingType()` is called
- Ensure `onStepChange` callback is passed to service

### Animations stuttering
- Check device performance
- Reduce particle count in `GranularStepProgress.tsx`
- Increase step delays for slower devices

### Modal not opening
- Verify `showStepModal` state is managed correctly
- Check `MiniStepIndicator` has `onPress` handler
- Ensure modal is rendered in component tree

### Steps completing too fast
- Adjust `STEP_DELAYS` in `granularAgentService.ts`
- Add artificial delays for demo purposes
- Consider user feedback on pacing

## Best Practices

1. **Always initialize steps** before calling the service
2. **Handle errors gracefully** - mark failed steps appropriately
3. **Provide meaningful details** for each step
4. **Use appropriate icons** from Ionicons
5. **Test on different devices** for performance
6. **Consider accessibility** - ensure text is readable
7. **Monitor step completion times** for optimization

## Next Steps

- Integrate with Supabase edge function for real-time updates
- Add step-level error recovery
- Implement step history and replay
- Add analytics tracking
- Create A/B tests for different step sequences

