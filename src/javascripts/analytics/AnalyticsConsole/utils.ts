import { Event, FilteredEvent, Service } from './types';

export const getFilteredEvents = (
  clearedEventsIndex: number,
  showServiceSpecificDebugInfo: Service | '',
  filterText: string,
  events: Event[]
): { hiddenEvents: number; filteredEvents: FilteredEvent[] } => {
  const isRelevantEvent = (event: Event, index) => {
    if (index <= clearedEventsIndex) {
      return false;
    }
    if (!showServiceSpecificDebugInfo) {
      return true;
    }
    return (
      (showServiceSpecificDebugInfo === 'snowplow' && event.snowplow) ||
      (showServiceSpecificDebugInfo === 'segment' && event.segment)
    );
  };

  const isSearchResultEvent = (event) => {
    if (!filterText) return true;
    const isMatch = (text: string) => text.includes(filterText);
    return isMatch(event.name) || (event.snowplow && isMatch(event.snowplow.name));
  };

  const relevantEvents = events
    .map((event, index) => ({ ...event, index }))
    .filter(isRelevantEvent);
  const filteredEvents: FilteredEvent[] = relevantEvents.filter(isSearchResultEvent);
  const relevantEventsCount = relevantEvents.length;
  const hiddenEvents = relevantEventsCount - filteredEvents.length;
  return { hiddenEvents, filteredEvents };
};
