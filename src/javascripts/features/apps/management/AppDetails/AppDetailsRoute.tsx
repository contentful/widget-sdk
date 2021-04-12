import * as React from 'react';
import { AppDetails } from './AppDetails';
import { go } from 'states/Navigator';
import { getModule } from 'core/NgRegistry';
import { AppDefinition } from 'contentful-management/types';
import { Workbench } from '@contentful/forma-36-react-components';
import DocumentTitle from 'components/shared/DocumentTitle';
import { LoadingState } from 'features/loading-state';
import { HostingStateProvider } from './HostingStateProvider';
import { AppDefinitionWithBundle } from '../AppEditor/AppHosting';
import { AppBundleData } from '../AppEditor';
import { ManagementApiClient } from '../ManagementApiClient';

interface Event {
  enabled: boolean;
  targetUrl: string;
  topics: unknown[];
}

interface Props {
  definitions: AppDefinition[];
  bundles: { items: AppBundleData[] };
  definitionId: string;
  orgId: string;
  tab: string;
  isLoadingCanManageApps: boolean;
  isLoadingDefinitions: boolean;
  isLoadingBundles: boolean;
}

export function AppDetailsRoute(props: Props) {
  const [events, setEvents] = React.useState<Event | null>(null);
  const definition = React.useMemo<AppDefinitionWithBundle | undefined>(
    () => props.definitions.find((d) => d.sys.id === props.definitionId),
    [props.definitions, props.definitionId]
  );
  const requestLeaveConfirmation = React.useRef<Function | undefined>();
  const isDirty = React.useRef(false);
  const isLoading = [
    props.isLoadingCanManageApps,
    props.isLoadingDefinitions,
    props.isLoadingBundles,
  ].some(Boolean);

  React.useEffect(() => {
    async function getEvents() {
      try {
        const { targetUrl, topics } = await ManagementApiClient.getAppEvents(
          props.orgId,
          props.definitionId
        );

        setEvents({ enabled: true, targetUrl, topics });
      } catch (e) {
        if (e.status === 404) {
          setEvents({ enabled: false, targetUrl: '', topics: [] });
        } else {
          go({ path: 'error' });
        }
      }
    }

    getEvents();
  }, [props.orgId, props.definitionId]);

  React.useEffect(() => {
    const $rootScope = getModule('$rootScope');

    // TODO: Find a way to remove it
    const unsubscribe = $rootScope.$on('$stateChangeStart', (event, toState, toStateParams) => {
      if (!isDirty.current || !requestLeaveConfirmation.current) return;

      event.preventDefault();
      requestLeaveConfirmation.current().then((confirmed) => {
        if (!confirmed) return;

        isDirty.current = false;
        go({ path: toState.name, params: toStateParams });
      });
    });

    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (props.definitions.length > 0 && !definition) {
      go({ path: 'error' });
    }
  }, [props.definitions, definition]);

  function goToTab(tab) {
    go({
      path: '^.definitions',
      params: { ...props, tab },
      options: { location: 'replace', notify: false },
    });
  }

  function goToListView() {
    go({ path: '^.list' });
  }

  function setRequestLeaveConfirmation(callback) {
    requestLeaveConfirmation.current = callback;
  }

  function setDirty(value) {
    isDirty.current = value;
  }

  if (isLoading || !definition || !events || !props.bundles)
    return (
      <Workbench>
        <DocumentTitle title="Apps" />
        <Workbench.Header title="App details" onBack={goToListView} />
        <LoadingState />
      </Workbench>
    );

  return (
    <HostingStateProvider
      orgId={props.orgId}
      defaultValue={!definition.src && !!definition.bundle}
      bundles={props.bundles}>
      <AppDetails
        {...props}
        definition={definition}
        bundles={props.bundles}
        events={events}
        goToTab={goToTab}
        goToListView={goToListView}
        setRequestLeaveConfirmation={setRequestLeaveConfirmation}
        setDirty={setDirty}
      />
    </HostingStateProvider>
  );
}
