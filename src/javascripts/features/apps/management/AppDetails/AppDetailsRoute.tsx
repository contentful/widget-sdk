import * as React from 'react';
import { AppDetails } from './AppDetails';
import { router } from 'core/react-routing';
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
import { useParams, useRouteNavigate } from 'core/react-routing';

interface Event {
  enabled: boolean;
  targetUrl: string;
  topics: unknown[];
}

interface Props {
  definitions: AppDefinition[];
  bundles: { items: AppBundleData[] };
  orgId: string;
  isLoadingCanManageApps: boolean;
  isLoadingDefinitions: boolean;
  isLoadingBundles: boolean;
}

export function AppDetailsRoute(props: Props) {
  const { definitionId, tab } = useParams();
  const [events, setEvents] = React.useState<Event | null>(null);
  const navigate = useRouteNavigate();
  const definition = React.useMemo<AppDefinitionWithBundle | undefined>(
    () => props.definitions.find((d) => d.sys.id === definitionId),
    [props.definitions, definitionId]
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
          definitionId
        );

        setEvents({ enabled: true, targetUrl, topics });
      } catch (e) {
        if (e.status === 404) {
          setEvents({ enabled: false, targetUrl: '', topics: [] });
        } else {
          router.navigate({ path: 'error' });
        }
      }
    }

    getEvents();
  }, [props.orgId, definitionId]);

  React.useEffect(() => {
    if (props.definitions.length > 0 && !definition) {
      router.navigate({ path: 'error' });
    }
  }, [props.definitions, definition]);

  function goToTab(tab) {
    navigate(
      {
        path: 'organizations.apps.definition',
        ...props,
        definitionId,
        tab,
      },
      { replace: true, state: { ignoreLeaveConfirmation: true } }
    );
  }

  function goToListView() {
    navigate({ path: 'organizations.apps.list', orgId: props.orgId });
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
          tab={tab}
          definition={definition}
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
