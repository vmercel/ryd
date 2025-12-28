import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, CalendarUtils } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { getSupabaseClient } from '@/template';
import { useAuth } from '@/template';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { CommonStyles } from '../../constants/styles';

type ViewMode = 'day' | 'week' | 'month' | 'year';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  event_type: string;
  metadata_json?: any;
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState<any>({});

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user, selectedDate, viewMode]);

  const loadEvents = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();

    // Load events for the selected period
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('start_time', { ascending: true });

    if (!error && data) {
      setEvents(data);
      
      // Mark dates that have events
      const marked: any = {};
      data.forEach((event) => {
        const dateKey = event.start_time.split('T')[0];
        marked[dateKey] = {
          marked: true,
          dotColor: Colors.primary.main,
        };
      });
      setMarkedDates(marked);
    }

    setLoading(false);
  };

  const getEventsForSelectedDate = () => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    return events.filter((event) => event.start_time.startsWith(dateKey));
  };

  const getEventsForWeek = () => {
    const weekStart = new Date(selectedDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return events.filter((event) => {
      const eventDate = new Date(event.start_time);
      return eventDate >= weekStart && eventDate < weekEnd;
    });
  };

  const getEventsForMonth = () => {
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

    return events.filter((event) => {
      const eventDate = new Date(event.start_time);
      return eventDate >= monthStart && eventDate <= monthEnd;
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const changeMonth = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const renderEvent = (event: CalendarEvent) => {
    const getEventIcon = (type: string) => {
      if (type.includes('flight')) return 'airplane';
      if (type.includes('hotel')) return 'bed';
      if (type.includes('ride')) return 'car';
      return 'calendar';
    };

    return (
      <View key={event.id} style={styles.eventCard}>
        <View style={styles.eventIcon}>
          <Ionicons
            name={getEventIcon(event.event_type)}
            size={20}
            color={Colors.primary.main}
          />
        </View>
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          {event.description ? (
            <Text style={styles.eventDescription}>{event.description}</Text>
          ) : null}
          <Text style={styles.eventTime}>
            {formatTime(event.start_time)} - {formatTime(event.end_time)}
          </Text>
        </View>
      </View>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForSelectedDate();

    return (
      <ScrollView style={styles.viewContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.dateHeader}>{formatDate(selectedDate)}</Text>
        {dayEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={Colors.text.tertiary} />
            <Text style={styles.emptyText}>No events scheduled</Text>
          </View>
        ) : (
          dayEvents.map(renderEvent)
        )}
      </ScrollView>
    );
  };

  const renderWeekView = () => {
    const weekEvents = getEventsForWeek();
    const weekStart = new Date(selectedDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      return day;
    });

    return (
      <ScrollView style={styles.viewContainer} showsVerticalScrollIndicator={false}>
        {days.map((day) => {
          const dayKey = day.toISOString().split('T')[0];
          const dayEvents = weekEvents.filter((e) => e.start_time.startsWith(dayKey));

          return (
            <View key={dayKey} style={styles.weekDaySection}>
              <Text style={styles.weekDayHeader}>{formatDate(day)}</Text>
              {dayEvents.length > 0 ? (
                dayEvents.map(renderEvent)
              ) : (
                <Text style={styles.noEventsText}>No events</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderMonthView = () => {
    return (
      <View style={styles.viewContainer}>
        <Calendar
          current={selectedDate.toISOString().split('T')[0]}
          onDayPress={(day: any) => {
            setSelectedDate(new Date(day.dateString));
            setViewMode('day');
          }}
          markedDates={{
            ...markedDates,
            [selectedDate.toISOString().split('T')[0]]: {
              ...markedDates[selectedDate.toISOString().split('T')[0]],
              selected: true,
              selectedColor: Colors.primary.main,
            },
          }}
          theme={{
            backgroundColor: Colors.background.primary,
            calendarBackground: Colors.background.primary,
            textSectionTitleColor: Colors.text.secondary,
            selectedDayBackgroundColor: Colors.primary.main,
            selectedDayTextColor: Colors.text.primary,
            todayTextColor: Colors.accent.blue,
            dayTextColor: Colors.text.primary,
            textDisabledColor: Colors.text.tertiary,
            dotColor: Colors.primary.main,
            selectedDotColor: Colors.text.primary,
            monthTextColor: Colors.text.primary,
            textMonthFontWeight: '600',
          }}
        />
        
        <ScrollView style={styles.monthEventsList} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Events this month</Text>
          {getEventsForMonth().map(renderEvent)}
        </ScrollView>
      </View>
    );
  };

  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(selectedDate.getFullYear(), i, 1);
      const monthEvents = events.filter((event) => {
        const eventDate = new Date(event.start_time);
        return eventDate.getMonth() === i && eventDate.getFullYear() === selectedDate.getFullYear();
      });

      return { date: monthDate, count: monthEvents.length };
    });

    return (
      <ScrollView style={styles.viewContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.yearHeader}>{selectedDate.getFullYear()}</Text>
        <View style={styles.monthsGrid}>
          {months.map((month, index) => (
            <TouchableOpacity
              key={index}
              style={styles.monthCard}
              onPress={() => {
                const newDate = new Date(selectedDate.getFullYear(), index, 1);
                setSelectedDate(newDate);
                setViewMode('month');
              }}
            >
              <Text style={styles.monthName}>
                {month.date.toLocaleDateString('en-US', { month: 'short' })}
              </Text>
              <Text style={styles.monthEventCount}>
                {month.count} {month.count === 1 ? 'event' : 'events'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[CommonStyles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          
          <Text style={styles.title}>
            {viewMode === 'year'
              ? selectedDate.getFullYear()
              : selectedDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
          </Text>

          <TouchableOpacity onPress={() => changeMonth(1)}>
            <Ionicons name="chevron-forward" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* View Mode Selector */}
        <View style={styles.viewModeSelector}>
          {(['day', 'week', 'month', 'year'] as ViewMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.viewModeButton,
                viewMode === mode && styles.viewModeButtonActive,
              ]}
              onPress={() => setViewMode(mode)}
            >
              <Text
                style={[
                  styles.viewModeText,
                  viewMode === mode && styles.viewModeTextActive,
                ]}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
        </View>
      ) : (
        <>
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'year' && renderYearView()}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
  },

  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },

  viewModeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },

  viewModeButtonActive: {
    backgroundColor: Colors.primary.main,
  },

  viewModeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
    color: Colors.text.secondary,
  },

  viewModeTextActive: {
    color: Colors.text.primary,
  },

  viewContainer: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dateHeader: {
    fontSize: Typography.sizes.xl,
    fontWeight: '600',
    color: Colors.text.primary,
    padding: Spacing.lg,
  },

  eventCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },

  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },

  eventContent: {
    flex: 1,
  },

  eventTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },

  eventDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },

  eventTime: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },

  emptyText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.tertiary,
    marginTop: Spacing.md,
  },

  weekDaySection: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },

  weekDayHeader: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },

  noEventsText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },

  monthEventsList: {
    flex: 1,
    marginTop: Spacing.lg,
  },

  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },

  yearHeader: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },

  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
  },

  monthCard: {
    width: '33.33%',
    padding: Spacing.md,
  },

  monthName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },

  monthEventCount: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});
