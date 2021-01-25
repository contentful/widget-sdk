import React from 'react';
import PropTypes from 'prop-types';
import * as SpaceEnvironmentRepo from 'data/CMA/SpaceEnvironmentsRepo';
import * as SpaceAliasesRepo from 'data/CMA/SpaceAliasesRepo';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import { getModule } from 'core/NgRegistry';
import { KeyEditorRoute } from 'features/api-keys-management';
import { go } from 'states/Navigator';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { KeyEditorWorkbench } from 'features/api-keys-management/api-key-editor/KeyEditorWorkbench';

export function KeyEditorContainer(props) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [spaceEnvironmentsRepo, setSpaceEnvironmentsRepo] = React.useState(null);
  const [spaceAliasesRepo, setSpaceAliasesRepo] = React.useState(null);
  const requestLeaveConfirmation = React.useRef();
  const isDirty = React.useRef(false);

  React.useEffect(() => {
    const spaceEndpoint = createSpaceEndpoint(props.spaceId, props.environmentId);
    const spaceEnvironmentsRepo = SpaceEnvironmentRepo.create(spaceEndpoint);
    const spaceAliasesRepo = SpaceAliasesRepo.create(spaceEndpoint);

    setSpaceEnvironmentsRepo(spaceEnvironmentsRepo);
    setSpaceAliasesRepo(spaceAliasesRepo);
    setIsLoading(false);
  }, [props.spaceId, props.environmentId]);

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

  function registerSaveAction(save) {
    requestLeaveConfirmation.current = createUnsavedChangesDialogOpener(save);
  }

  function setDirty(value) {
    isDirty.current = value;
  }

  if (isLoading) return <KeyEditorWorkbench />;

  return (
    <KeyEditorRoute
      {...props}
      spaceId={props.spaceId}
      apiKeyId={props.apiKeyId}
      spaceEnvironmentsRepo={spaceEnvironmentsRepo}
      spaceAliasesRepo={spaceAliasesRepo}
      setDirty={setDirty}
      registerSaveAction={registerSaveAction}
    />
  );
}

KeyEditorContainer.propTypes = {
  spaceId: PropTypes.string.isRequired,
  apiKeyId: PropTypes.string,
  environmentId: PropTypes.string,
};
