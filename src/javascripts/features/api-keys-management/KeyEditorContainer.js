import React from 'react';
import PropTypes from 'prop-types';
import * as SpaceEnvironmentRepo from 'data/CMA/SpaceEnvironmentsRepo';
import * as SpaceAliasesRepo from 'data/CMA/SpaceAliasesRepo';
import { KeyEditorRoute } from 'features/api-keys-management';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { KeyEditorWorkbench } from 'features/api-keys-management/api-key-editor/KeyEditorWorkbench';
import { useUnsavedChangesModal } from 'core/hooks';

export function KeyEditorContainer(props) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [spaceEnvironmentsRepo, setSpaceEnvironmentsRepo] = React.useState(null);
  const [spaceAliasesRepo, setSpaceAliasesRepo] = React.useState(null);

  const { registerSaveAction, setDirty } = useUnsavedChangesModal();

  React.useEffect(() => {
    const spaceEndpoint = createSpaceEndpoint(props.spaceId, props.environmentId);
    const spaceEnvironmentsRepo = SpaceEnvironmentRepo.create(spaceEndpoint);
    const spaceAliasesRepo = SpaceAliasesRepo.create(spaceEndpoint);

    setSpaceEnvironmentsRepo(spaceEnvironmentsRepo);
    setSpaceAliasesRepo(spaceAliasesRepo);
    setIsLoading(false);
  }, [props.spaceId, props.environmentId]);

  if (isLoading) {
    return <KeyEditorWorkbench />;
  }

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
