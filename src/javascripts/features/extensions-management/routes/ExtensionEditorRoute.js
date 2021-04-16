import React from 'react';
import { ExtensionEditor } from '../ExtensionEditor';
import { ExtensionEditorSkeleton } from '../skeletons/ExtensionEditorSkeleton';
import createFetcherComponent from 'app/common/createFetcherComponent';
import { getSectionVisibility } from 'access_control/AccessChecker';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import DocumentTitle from 'components/shared/DocumentTitle';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';
import { useParams } from 'core/react-routing';
import { useUnsavedChangesModal } from 'core/hooks/useUnsavedChangesModal/useUnsavedChangesModal';
import { useRouteNavigate, RouteNavigate } from 'core/react-routing';

const ExtensionFetcher = createFetcherComponent(({ cma, extensionId }) => {
  return cma.getExtension(extensionId);
});

export function ExtensionEditorRoute() {
  const { extensionId } = useParams();
  const navigate = useRouteNavigate();
  const cma = useCurrentSpaceAPIClient();

  const { registerSaveAction, setDirty } = useUnsavedChangesModal();

  function goToList() {
    return navigate({ path: 'extensions.list' });
  }

  if (!getSectionVisibility()['extensions']) {
    return <ForbiddenPage />;
  }

  return (
    <ExtensionFetcher cma={cma} extensionId={extensionId}>
      {({ isLoading, isError, data }) => {
        if (isLoading) {
          return <ExtensionEditorSkeleton goToList={goToList} />;
        }
        if (isError) {
          return <RouteNavigate route={{ path: 'extensions.list' }} replace />;
        }
        return (
          <React.Fragment>
            <DocumentTitle title={[data.extension.name, 'Extensions']} />
            <ExtensionEditor
              entity={data}
              registerSaveAction={registerSaveAction}
              setDirty={setDirty}
              goToList={goToList}
              cma={cma}
            />
          </React.Fragment>
        );
      }}
    </ExtensionFetcher>
  );
}
