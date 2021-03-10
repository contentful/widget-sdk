import * as React from 'react';
import ReactDOM from 'react-dom';
import {
  Button,
  Card,
  CheckboxField,
  EditorToolbar,
  EditorToolbarButton,
  Option,
  Select,
  TextField,
  TextLink,
} from '@contentful/forma-36-react-components';
import type { Observable } from 'kefir';
import pluralize from 'pluralize';
import { styles } from './styles';
import { Event, Service, SessionData } from './types';
import { getFilteredEvents } from './utils';
import { useScroll } from './useScroll';
import { useCachedState } from './useCachedState';

interface AnalyticsConsoleProps {
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => {};
  sessionData$: Observable<SessionData, unknown>;
  events$: Observable<Event[], unknown>;
}

const PrettyData = ({ data }: { data?: object }) => {
  const prettyData = (data?: object): string => (data ? JSON.stringify(data, null, 2) : 'no data');
  return <pre className={styles.data}>{prettyData(data)}</pre>;
};

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
  const [showServiceDebugInfo, setShowServiceDebugInfo] = useCachedState<Service | ''>(
    'showServiceDebugInfo',
    ''
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
    setShowServiceDebugInfo('');
    const newShowSessionData = !showSessionData;
    setShowSessionData(newShowSessionData);
    showSessionData ? scrollUp() : scrollDown();
  };

  const toggleServiceDebugInfo = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const service = e.target.value as Service | '';
    setShowSessionData(false);
    setShowServiceDebugInfo(service);
    if (service) {
      scrollDown();
    }
  };

  const toggleCollapsed = () => setIsCollapsed(!isCollapsed);
  const toggleShowData = () => setShowData(!showData);

  const { hiddenEvents, filteredEvents } = getFilteredEvents(
    clearedEventsIndex,
    showServiceDebugInfo,
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
      {showServiceDebugInfo
        ? filteredEvents.map(({ index, time, ...serviceEvents }) => (
            <ServiceEvent
              key={index}
              index={index}
              time={time}
              serviceEvent={serviceEvents[showServiceDebugInfo]}
              showData={showData}
            />
          ))
        : filteredEvents.map(({ index, time, name, isValid, data }) => (
            <div key={index} className={styles.event}>
              <div>
                #{index + 1} - {time} <strong>{name}</strong>
                {!isValid && <span> invalid name</span>}
              </div>
              {showData && <PrettyData data={data} />}
            </div>
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
            onChange={toggleServiceDebugInfo}>
            <Option value="">Untransformed</Option>
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

function ServiceEvent({
  index,
  time,
  serviceEvent,
  showData,
}: {
  index: number;
  time: string;
  serviceEvent: Event['snowplow'] | Event['segment'];
  showData: boolean;
}) {
  return (
    <div className={styles.event}>
      <div>
        #{index + 1} - {time}{' '}
        <strong>
          {serviceEvent.name}, v{serviceEvent.version}
        </strong>
      </div>
      {showData && (
        <React.Fragment>
          <PrettyData data={serviceEvent.data} />
          {serviceEvent.context && <PrettyData data={serviceEvent.context} />}
        </React.Fragment>
      )}
    </div>
  );
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
