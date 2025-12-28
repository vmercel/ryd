// Proactive AI service - infers trip parameters from minimal input

import { UserProfile } from '../types';

interface TripInference {
  origin: string;
  destination: string;
  departDate: Date;
  returnDate: Date;
  budget: number;
  cabinClass: string;
  nonstopOnly: boolean;
  travelers: number;
  confidence: number; // 0-1
}

interface InferenceInput {
  userInput: string;
  currentLocation?: {
    city?: string;
    nearestAirport?: string;
  };
  userProfile?: UserProfile;
  calendarAvailability?: Date[];
}

export const inferTripParameters = async (
  input: InferenceInput
): Promise<TripInference> => {
  const { userInput, currentLocation, userProfile, calendarAvailability } = input;

  // Extract destination from user input (simplified NLP)
  const destination = extractDestination(userInput);

  // Infer origin
  const origin = inferOrigin(currentLocation, userProfile);

  // Infer dates
  const { departDate, returnDate } = inferDates(
    userInput,
    calendarAvailability
  );

  // Infer budget
  const budget = inferBudget(userInput, userProfile);

  // Infer preferences
  const cabinClass = inferCabinClass(userInput, userProfile);
  const nonstopOnly = userInput.toLowerCase().includes('nonstop');
  const travelers = inferTravelers(userInput);

  return {
    origin,
    destination,
    departDate,
    returnDate,
    budget,
    cabinClass,
    nonstopOnly,
    travelers,
    confidence: 0.85, // Mock confidence score
  };
};

const extractDestination = (input: string): string => {
  // Simplified destination extraction
  // In production: Use NER (Named Entity Recognition) or LLM
  const destinations = [
    'Tokyo',
    'Paris',
    'London',
    'New York',
    'Rome',
    'Barcelona',
    'Dubai',
    'Singapore',
    'Bangkok',
    'Sydney',
  ];

  const found = destinations.find((dest) =>
    input.toLowerCase().includes(dest.toLowerCase())
  );

  return found || 'DESTINATION';
};

const inferOrigin = (
  currentLocation?: { city?: string; nearestAirport?: string },
  userProfile?: UserProfile
): string => {
  // Priority: User profile home airport > GPS location > Default
  if (userProfile?.home_airport) {
    return userProfile.home_airport;
  }

  if (currentLocation?.nearestAirport && currentLocation.nearestAirport !== 'UNKNOWN') {
    return currentLocation.nearestAirport;
  }

  if (currentLocation?.city) {
    return currentLocation.city;
  }

  return 'ORIGIN';
};

const inferDates = (
  input: string,
  availability?: Date[]
): { departDate: Date; returnDate: Date } => {
  const inputLower = input.toLowerCase();

  // Check for specific month mentions
  const months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];

  const mentionedMonth = months.findIndex((month) =>
    inputLower.includes(month)
  );

  if (mentionedMonth !== -1) {
    const targetDate = new Date();
    targetDate.setMonth(mentionedMonth);
    if (targetDate < new Date()) {
      targetDate.setFullYear(targetDate.getFullYear() + 1);
    }

    // Find first weekend in that month
    while (targetDate.getDay() !== 5) {
      // Friday
      targetDate.setDate(targetDate.getDate() + 1);
    }

    const returnDate = new Date(targetDate);
    returnDate.setDate(returnDate.getDate() + 7);

    return { departDate: targetDate, returnDate };
  }

  // Check for relative time mentions
  if (inputLower.includes('next week')) {
    const departDate = new Date();
    departDate.setDate(departDate.getDate() + 7);
    const returnDate = new Date(departDate);
    returnDate.setDate(returnDate.getDate() + 7);
    return { departDate, returnDate };
  }

  if (inputLower.includes('next month')) {
    const departDate = new Date();
    departDate.setMonth(departDate.getMonth() + 1);
    const returnDate = new Date(departDate);
    returnDate.setDate(returnDate.getDate() + 7);
    return { departDate, returnDate };
  }

  // Use calendar availability if provided
  if (availability && availability.length > 0) {
    const departDate = availability[0];
    const returnDate = new Date(departDate);
    returnDate.setDate(returnDate.getDate() + 7);
    return { departDate, returnDate };
  }

  // Default: 2 weeks from now
  const departDate = new Date();
  departDate.setDate(departDate.getDate() + 14);
  const returnDate = new Date(departDate);
  returnDate.setDate(returnDate.getDate() + 7);

  return { departDate, returnDate };
};

const inferBudget = (input: string, userProfile?: UserProfile): number => {
  // Extract explicit budget mentions
  const budgetMatch = input.match(/\$?(\d+)k?/i);
  if (budgetMatch) {
    const amount = parseInt(budgetMatch[1], 10);
    return budgetMatch[0].includes('k') ? amount * 1000 : amount;
  }

  // Check for budget hints
  if (
    input.toLowerCase().includes('cheap') ||
    input.toLowerCase().includes('budget')
  ) {
    return 1000;
  }

  if (
    input.toLowerCase().includes('luxury') ||
    input.toLowerCase().includes('first class')
  ) {
    return 5000;
  }

  // Default moderate budget
  return 2000;
};

const inferCabinClass = (input: string, userProfile?: UserProfile): string => {
  const inputLower = input.toLowerCase();

  if (inputLower.includes('first class')) return 'first';
  if (inputLower.includes('business')) return 'business';
  if (inputLower.includes('premium')) return 'premium_economy';

  // Check user preferences
  const prefs = userProfile?.prefs_json;
  if (prefs?.preferred_cabin) {
    return prefs.preferred_cabin;
  }

  return 'economy';
};

const inferTravelers = (input: string): number => {
  // Extract traveler count
  const match = input.match(/(\d+)\s*(person|people|traveler|passenger)/i);
  if (match) {
    return parseInt(match[1], 10);
  }

  // Check for group indicators
  if (input.toLowerCase().includes('family')) return 4;
  if (input.toLowerCase().includes('couple')) return 2;

  return 1;
};

export const buildProposal = (inference: TripInference) => {
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return {
    title: `Trip to ${inference.destination}`,
    details: {
      origin: inference.origin,
      destination: inference.destination,
      dates: `${formatDate(inference.departDate)} - ${formatDate(inference.returnDate)}`,
      budget: `$${inference.budget.toLocaleString()} total budget`,
      travelers: inference.travelers,
    },
  };
};
