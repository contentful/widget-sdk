import * as React from 'react';
import { AppDetails } from './AppDetails';
import { go } from 'states/Navigator';
import { AppDefinition } from 'contentful-management/types';
import { Workbench } from '@contentful/forma-36-react-components';
import DocumentTitle from 'components/shared/DocumentTitle';
import { LoadingState } from 'features/loading-state';
import { HostingStateProvider } from './HostingStateProvider';
import { AppDetailsStateProvider } from './AppDetailsStateContext';
import { AppDefinitionWithBundle } from '../AppEditor/AppHosting';
import { AppBundleData } from '../AppEditor';
import { ManagementApiClient } from '../ManagementApiClient';
import { useUnsavedChangesModal } from 'core/hooks';

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

  const { registerSaveAction, setDirty } = useUnsavedChangesModal();

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
      <AppDetailsStateProvider definition={definition} events={events}>
        <AppDetails
          {...props}
          definition={definition}
          bundles={props.bundles}
          events={events}
          goToTab={goToTab}
          goToListView={goToListView}
          setRequestLeaveConfirmation={registerSaveAction}
          setDirty={setDirty}
        />
      </AppDetailsStateProvider>
    </HostingStateProvider>
  );
}
