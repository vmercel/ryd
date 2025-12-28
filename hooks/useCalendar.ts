import { useState } from 'react';
import { Alert } from 'react-native';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

interface AvailableDates {
  suggested: Date[];
  conflicts: CalendarEvent[];
}

export const useCalendar = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const requestPermission = async () => {
    // Calendar integration will be added in next phase
    // For now, return mock availability
    Alert.alert(
      'Calendar Integration',
      'Google Calendar sync will be available soon. For now, Atlas will suggest dates based on your input.',
      [{ text: 'OK' }]
    );
    return false;
  };

  const getAvailableDates = async (
    startRange: Date,
    endRange: Date,
    tripDuration: number = 7
  ): Promise<AvailableDates> => {
    // Mock implementation - will integrate with Google Calendar API
    const suggested: Date[] = [];
    const currentDate = new Date(startRange);

    // Suggest next 3 weekends
    while (suggested.length < 3 && currentDate <= endRange) {
      if (currentDate.getDay() === 5) {
        // Friday
        suggested.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      suggested,
      conflicts: [],
    };
  };

  const hasConflicts = (startDate: Date, endDate: Date): boolean => {
    // Check if proposed trip dates conflict with calendar events
    return events.some(
      (event) =>
        (startDate >= event.start && startDate <= event.end) ||
        (endDate >= event.start && endDate <= event.end) ||
        (startDate <= event.start && endDate >= event.end)
    );
  };

  return {
    hasPermission,
    events,
    requestPermission,
    getAvailableDates,
    hasConflicts,
  };
};
