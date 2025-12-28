// Hook for managing granular step state
// Provides state management for ultra-detailed step tracking

import { useState, useCallback } from 'react';
import { StepMetadata } from '../types';
import {
  getAllStepsForBookingType,
  initializeSteps,
  calculateOverallProgress,
  getCurrentStep,
  BookingType,
} from '../constants/granularSteps';

export interface GranularStepState {
  steps: StepMetadata[];
  currentStep: StepMetadata | null;
  progress: number;
  completedCount: number;
  totalCount: number;
  isActive: boolean;
}

export function useGranularSteps() {
  const [stepState, setStepState] = useState<GranularStepState>({
    steps: [],
    currentStep: null,
    progress: 0,
    completedCount: 0,
    totalCount: 0,
    isActive: false,
  });

  /**
   * Initialize steps for a booking type
   */
  const initializeForBookingType = useCallback((bookingType: BookingType) => {
    const steps = initializeSteps(getAllStepsForBookingType(bookingType));
    setStepState({
      steps,
      currentStep: null,
      progress: 0,
      completedCount: 0,
      totalCount: steps.length,
      isActive: false,
    });
  }, []);

  /**
   * Update step state from callback
   */
  const handleStepChange = useCallback(
    (currentStep: StepMetadata | null, allSteps: StepMetadata[], progress: number) => {
      const completedCount = allSteps.filter(s => s.status === 'completed').length;
      
      setStepState({
        steps: allSteps,
        currentStep,
        progress,
        completedCount,
        totalCount: allSteps.length,
        isActive: true,
      });
    },
    []
  );

  /**
   * Reset step state
   */
  const reset = useCallback(() => {
    setStepState({
      steps: [],
      currentStep: null,
      progress: 0,
      completedCount: 0,
      totalCount: 0,
      isActive: false,
    });
  }, []);

  /**
   * Mark as complete
   */
  const complete = useCallback(() => {
    setStepState(prev => ({
      ...prev,
      isActive: false,
      progress: 100,
      completedCount: prev.totalCount,
    }));
  }, []);

  return {
    stepState,
    initializeForBookingType,
    handleStepChange,
    reset,
    complete,
  };
}

