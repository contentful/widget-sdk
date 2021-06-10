import * as React from 'react';
import { css } from 'emotion';
import ReactDOM from 'react-dom';
import {
  Button,
  Card,
  CheckboxField,
  EditorToolbar,
  EditorToolbarButton,
  Option,
  Select,
  Tag,
  TextField,
  TextLink,
} from '@contentful/forma-36-react-components';
import type { Observable } from 'kefir';
import pluralize from 'pluralize';
import { styles } from './styles';
import { Event, EventSource, FilteredEvent, SessionData } from './types';
import { getFilteredEvents } from './utils';
import { useScroll } from './useScroll';
import { useCachedState } from './useCachedState';

interface AnalyticsConsoleProps {
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => {};
  sessionData$: Observable<SessionData, unknown>;
  events$: Observable<Event[], unknown>;
}

const DEFAULT_EVENT_SOURCE: EventSource = 'segment'; // Do not use "raw" as it might be more verbose and less informative.

const AnalyticsConsole: React.FunctionComponent<AnalyticsConsoleProps> = ({
  isVisible,
  setIsVisible,
  sessionData$,
  events$,
}) => {
  const [container, { scrollUp, scrollDown }] = useScroll<HTMLDivElement>();

  const closeConsole = () => setIsVisible(false);

  const [isCollapsed, setIsCollapsed] = useCachedState('isCollapsed', false);
  const [showSessionData, setShowSessionData] = useCachedState('showSessionData', false);
  const [eventSource, setEventSource] = useCachedState<EventSource>(
    'showServiceDebugInfo',
    DEFAULT_EVENT_SOURCE
  );
  const [showData, setShowData] = useCachedState('showData', false);
  const [events, setEvents] = useCachedState<Event[]>('events', []);
  const [sessionData, setSessionData] = useCachedState<SessionData | undefined>(
    'sessionData',
    undefined
  );
  const [filterText, setFilterText] = useCachedState('filterText', '');
  const [clearedEventsIndex, setClearedEventsIndex] = useCachedState('clearedEventsIndex', -1);

  React.useEffect(() => {
    sessionData$.onValue(setSessionData);
    events$.onValue(setEvents);
  }, [events$, sessionData$, setEvents, setSessionData]);

  React.useEffect(() => {
    if (!showSessionData) {
      scrollDown();
    }
  }, [events, showSessionData, scrollDown]);

  const clearEvents = () => setClearedEventsIndex(events.length - 1);
  const unclearEvents = () => setClearedEventsIndex(-1);
  const clearSearch = () => setFilterText('');

  React.useEffect(() => {
    // When opening the console, show no events for great performance and
    // no crazy scrolling. User can restore them if desired.
    clearEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  if (!isVisible) return null;

  const toggleSessionData = () => {
    setEventSource(DEFAULT_EVENT_SOURCE);
    const newShowSessionData = !showSessionData;
    setShowSessionData(newShowSessionData);
    showSessionData ? scrollUp() : scrollDown();
  };

  const toggleServiceDebugInfo = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const service = e.target.value as EventSource;
    setShowSessionData(false);
    setEventSource(service);
    if (service) {
      scrollDown();
    }
  };

  const toggleCollapsed = () => setIsCollapsed(!isCollapsed);
  const toggleShowData = () => setShowData(!showData);

  const { hiddenEvents, filteredEvents } = getFilteredEvents(
    clearedEventsIndex,
    eventSource,
    filterText,
    events
  );

  const renderEvents = () => (
    <React.Fragment>
      {clearedEventsIndex > -1 && (
        <div className={styles.info}>
          {clearedEventsIndex + 1} previous {pluralize('event', clearedEventsIndex + 1)}{' '}
          <TextLink onClick={unclearEvents}>[restore]</TextLink>
        </div>
      )}
      {!!hiddenEvents && (
        <div className={styles.info}>
          {hiddenEvents} {pluralize('event', hiddenEvents)} hidden by search{' '}
          <TextLink onClick={clearSearch}>[clear search]</TextLink>
        </div>
      )}
      {filteredEvents.map((event) => (
        <PrettyEvent
          key={`${eventSource}-${event.index}`}
          showData={showData}
          event={event}
          eventSource={eventSource}
        />
      ))}
    </React.Fragment>
  );

  const extrasDisabled = isCollapsed || showSessionData;

  return (
    <Card className={styles.card}>
      <EditorToolbar className={styles.toolbar}>
        <div>
          <EditorToolbarButton icon="Close" tooltip="Close" label="Close" onClick={closeConsole} />
          <EditorToolbarButton
            icon={isCollapsed ? 'ChevronUp' : 'ChevronDown'}
            tooltip={isCollapsed ? 'Maximize' : 'Minimize'}
            label={isCollapsed ? 'Maximize' : 'Minimize'}
            onClick={toggleCollapsed}
          />
        </div>
        <Button disabled={isCollapsed} buttonType="muted" size="medium" onClick={toggleSessionData}>
          Mode: {showSessionData ? 'Session data' : 'Events'}
        </Button>
        <div>
          <Select
            id="show-transformed"
            name="showTransformed"
            width="auto"
            onChange={toggleServiceDebugInfo}
            value={eventSource}>
            <Option value="raw">Untransformed</Option>
            <Option value="snowplow">Snowplow</Option>
            <Option value="segment">Segment</Option>
          </Select>

          <CheckboxField
            disabled={extrasDisabled}
            id="show-data"
            labelText="show data"
            name="showData"
            checked={showData}
            onChange={toggleShowData}
          />
        </div>
        <EditorToolbarButton
          disabled={extrasDisabled}
          icon="Delete"
          tooltip="Clear listed events so far"
          label="Clear listed events so far"
          onClick={clearEvents}
        />
      </EditorToolbar>
      {!isCollapsed && (
        <React.Fragment>
          <div className={styles.content} ref={container}>
            {showSessionData ? <PrettyData data={sessionData} /> : renderEvents()}
          </div>
          {!showSessionData && (
            <TextField
              className={styles.search}
              labelText="Filter"
              name="filter"
              id="filter"
              textLinkProps={{
                icon: 'InfoCircle',
                text: `${filteredEvents.length} ${pluralize('match', filteredEvents.length)}`,
              }}
              textInputProps={{
                id: 'filter-input',
                placeholder: 'Search',
              }}
              onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
                setFilterText(evt.target.value)
              }
              value={filterText}
            />
          )}
        </React.Fragment>
      )}
    </Card>
  );
};

interface PrettyEventProps {
  showData: boolean;
  event: FilteredEvent;
  eventSource: EventSource;
}

function PrettyEvent({ showData, event, eventSource }: PrettyEventProps) {
  const { index, time, isValid } = event;
  const current = event[eventSource];
  if (!current) {
    return null; // Event isn't tracked to the selected service.
  }
  return (
    <div className={styles.event}>
      <div>
        #{index + 1} - {time} <strong>{event.raw.name}</strong>
        {eventSource === 'raw' && event.segment && <Info type="positive" value="Segment" />}
        {eventSource === 'raw' && event.snowplow && <Info type="warning" value="Snowplow" />}
        {current.name && current.name !== event.raw.name && (
          <Info type="primary" isLowerCase={true} value={current.name} />
        )}
        {current.version && <Info type="secondary" value={`v${current.version}`} />}
        {!isValid && <Info type="negative" value="invalid name" />}
      </div>
      {showData && (
        <React.Fragment>
          <PrettyData data={current.data} />
          {current.context && <PrettyData data={current.context} />}
        </React.Fragment>
      )}
    </div>
  );
}

function Info({ value, type, isLowerCase = false }) {
  const style = isLowerCase ? css({ textTransform: 'none' }) : undefined;
  return (
    <>
      {' '}
      <Tag className={style} size="small" tagType={type}>
        {value}
      </Tag>
    </>
  );
}

function PrettyData({ data }: { data?: object }) {
  const prettyData = (data?: object): string => (data ? JSON.stringify(data, null, 2) : 'no data');
  return <pre className={styles.data}>{prettyData(data)}</pre>;
}

const WRAPPER_CLASS_NAME = 'analytics-console-wrapper';
const replaceOrAppend = (element: HTMLElement) => {
  const existingElement = document.querySelector(`.${WRAPPER_CLASS_NAME}`);
  if (existingElement) {
    existingElement.replaceWith(element);
  } else {
    document.body.appendChild(element);
  }
};

export const render = (scope: AnalyticsConsoleProps) => {
  const element = document.createElement('div');
  element.classList.add(WRAPPER_CLASS_NAME);
  ReactDOM.render(<AnalyticsConsole {...scope} />, element);
  replaceOrAppend(element);
};
