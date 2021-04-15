import { Event, FilteredEvent, EventSource } from './types';

export const getFilteredEvents = (
  clearedEventsIndex: number,
  eventSource: EventSource,
  filterText: string,
  events: Event[]
): { hiddenEvents: number; filteredEvents: FilteredEvent[] } => {
  const isRelevantEvent = (event: Event, index) => {
    if (index <= clearedEventsIndex) {
      return false;
    }
    return !!event[eventSource];
  };

  const isSearchResultEvent = (event) => {
    if (!filterText) return true;
    const isMatch = (text: string) => text.includes(filterText);
    return (
      isMatch(event.raw.name) ||
      (event.snowplow && isMatch(event.snowplow.name)) ||
      (event.segment && isMatch(event.segment.name))
    );
  };

  const relevantEvents = events
    .map((event, index) => ({ ...event, index }))
    .filter(isRelevantEvent);
  const filteredEvents: FilteredEvent[] = relevantEvents.filter(isSearchResultEvent);
  const relevantEventsCount = relevantEvents.length;
  const hiddenEvents = relevantEventsCount - filteredEvents.length;
  return { hiddenEvents, filteredEvents };
};
