import React from 'react';
import PropTypes from 'prop-types';
import { ExtensionEditor } from '../ExtensionEditor';
import { ExtensionEditorSkeleton } from '../skeletons/ExtensionEditorSkeleton';
import createFetcherComponent from 'app/common/createFetcherComponent';
import StateRedirect from 'app/common/StateRedirect';
import { getSectionVisibility } from 'access_control/AccessChecker';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getModule } from 'core/NgRegistry';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import { go } from 'states/Navigator';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';

const ExtensionFetcher = createFetcherComponent(({ cma, extensionId }) => {
  return cma.getExtension(extensionId);
});

export function ExtensionEditorRoute(props) {
  const { client: cma } = useCurrentSpaceAPIClient();
  const requestLeaveConfirmation = React.useRef();
  const isDirty = React.useRef(false);

  React.useEffect(() => {
    const $rootScope = getModule('$rootScope');

    const unsubscribe = $rootScope.$on('$stateChangeStart', (event, toState, toStateParams) => {
      if (!isDirty.current || !requestLeaveConfirmation.current) return;

      event.preventDefault();
      requestLeaveConfirmation.current().then((confirmed) => {
        if (!confirmed) return;

        isDirty.current = false;
        return go({ path: toState.name, params: toStateParams });
      });
    });

    return unsubscribe;
  }, []);

  function registerSaveAction(save) {
    requestLeaveConfirmation.current = createUnsavedChangesDialogOpener(save);
  }

  function setDirty(value) {
    isDirty.current = value;
  }

  function goToList() {
    return go({ path: '^.list' });
  }

  if (!getSectionVisibility()['extensions']) {
    return <ForbiddenPage />;
  }

  return (
    <ExtensionFetcher cma={cma} extensionId={props.extensionId}>
      {({ isLoading, isError, data }) => {
        if (isLoading) {
          return <ExtensionEditorSkeleton goToList={goToList} />;
        }
        if (isError) {
          return <StateRedirect path="^.list" />;
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

ExtensionEditorRoute.propTypes = {
  extensionId: PropTypes.string.isRequired,
};
