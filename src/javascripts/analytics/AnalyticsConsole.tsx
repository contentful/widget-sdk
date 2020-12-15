import * as React from 'react';
import ReactDOM from 'react-dom';
import { css } from 'emotion';
import {
  Button,
  CheckboxField,
  EditorToolbar,
  EditorToolbarButton,
  Card,
  TextLink,
  TextField,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import type { Observable } from 'kefir';
import pluralize from 'pluralize';

const styles = {
  card: css({
    position: 'fixed',
    width: '600px',
    right: tokens.spacingM,
    bottom: tokens.spacingM,
  }),
  toolbar: css({
    justifyContent: 'space-between',
    '& > div': {
      display: 'flex',
      alignItems: 'center',
      '& > div+div': {
        padding: `0 ${tokens.spacingS}`,
      },
    },
  }),
  content: css({
    height: '450px',
    overflowY: 'scroll',
    padding: '0 15px',
    margin: '5px 0',
  }),
  info: css({
    borderTop: '1px dotted gray',
    marginTop: '-1px',
    padding: '15px 5px',
    fontStyle: 'italic',
    textAlign: 'center',
    '& > button': {
      fontStyle: 'normal',
    },
  }),
  filter: css({
    display: 'flex',
    alignItems: 'baseline',
    padding: '5px',
    borderTop: '1px solid black',
  }),
  event: css({
    borderTop: '1px dotted gray',
    marginTop: '-1px',
    padding: '15px 5px',
    '& span': {
      color: 'red',
    },
  }),
  data: css({
    fontSize: '0.9em',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  }),
  search: css({
    '& button': {
      pointerEvents: 'none',
    },
  }),
};

interface Event {
  time: string;
  name: string;
  isValid: boolean;
  data?: object;
  snowplow: {
    name: string;
    context?: object;
    data?: object;
    version: string;
  };
}

interface FilteredEvent extends Event {
  index: number;
}

type SessionData = {};

interface AnalyticsConsoleProps {
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => {};
  sessionData$: Observable<SessionData, unknown>;
  events$: Observable<Event[], unknown>;
}

const getFilteredEvents = (
  clearedEventsIndex: number,
  showSnowplowDebugInfo: boolean,
  filterText: string,
  events: Event[]
): { hiddenEvents: number; filteredEvents: FilteredEvent[] } => {
  const isRelevantEvent = (event, index) => {
    if (index <= clearedEventsIndex) return false;
    if (showSnowplowDebugInfo && !event.snowplow) return false;
    return true;
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

const useScroll = <T extends HTMLElement>(): [
  React.MutableRefObject<T | null>,
  { scrollUp: Function; scrollDown: Function }
] => {
  const ref = React.useRef<T | null>(null);

  const actions = React.useMemo(() => {
    const scroll = (top = 0) => {
      ref.current?.scroll({
        top,
        left: 0,
        behavior: 'smooth',
      });
    };
    const scrollUp = () => scroll();
    const scrollDown = () => scroll(ref.current?.scrollHeight);
    return { scrollUp, scrollDown };
  }, []);

  return [ref, actions];
};

const PrettyData = ({ data }: { data?: object }) => {
  const prettyData = (data?: object): string => (data ? JSON.stringify(data, null, 2) : 'no data');
  return <pre className={styles.data}>{prettyData(data)}</pre>;
};

// Persist state between recreation of dom element
const cache = {};
const useCachedState = <T extends unknown>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = React.useState<T>(cache[key] ?? defaultValue);
  const setCachedState = React.useCallback(
    (newValue: React.SetStateAction<T>) => {
      cache[key] = newValue;
      setState(newValue);
    },
    [key]
  );
  return [state, setCachedState];
};

export const AnalyticsConsole: React.FunctionComponent<AnalyticsConsoleProps> = ({
  isVisible,
  setIsVisible,
  sessionData$,
  events$,
}) => {
  const [container, { scrollUp, scrollDown }] = useScroll<HTMLDivElement>();

  const closeConsole = () => setIsVisible(false);

  const [isCollapsed, setIsCollapsed] = useCachedState('isCollapsed', false);
  const [showSessionData, setShowSessionData] = useCachedState('showSessionData', false);
  const [showSnowplowDebugInfo, setShowSnowplowDebugInfo] = useCachedState(
    'showSnowplowDebugInfo',
    false
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
    setShowSnowplowDebugInfo(false);
    const newShowSessionData = !showSessionData;
    setShowSessionData(newShowSessionData);
    showSessionData ? scrollUp() : scrollDown();
  };

  const toggleSnowplowDebugInfo = () => {
    setShowSessionData(false);
    const newShowingSnowplowDebugInfo = !showSnowplowDebugInfo;
    setShowSnowplowDebugInfo(newShowingSnowplowDebugInfo);
    if (newShowingSnowplowDebugInfo) {
      scrollDown();
    }
  };

  const toggleCollapsed = () => setIsCollapsed(!isCollapsed);
  const toggleShowData = () => setShowData(!showData);

  const { hiddenEvents, filteredEvents } = getFilteredEvents(
    clearedEventsIndex,
    showSnowplowDebugInfo,
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
      {showSnowplowDebugInfo
        ? filteredEvents.map(({ index, time, snowplow }) => (
            <div key={index} className={styles.event}>
              <div>
                #{index + 1} - {time}{' '}
                <strong>
                  {snowplow.name}, v{snowplow.version}
                </strong>
              </div>
              {showData && (
                <React.Fragment>
                  <PrettyData data={snowplow.data} />
                  {snowplow.context && <PrettyData data={snowplow.context} />}
                </React.Fragment>
              )}
            </div>
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
        <Button disabled={isCollapsed} buttonType="muted" size="small" onClick={toggleSessionData}>
          Mode: {showSessionData ? 'Session data' : 'Events'}
        </Button>
        <div>
          <CheckboxField
            disabled={extrasDisabled}
            id="show-transformed"
            labelText="Show transformed"
            name="showTransformed"
            checked={showSnowplowDebugInfo}
            onChange={toggleSnowplowDebugInfo}
          />
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
