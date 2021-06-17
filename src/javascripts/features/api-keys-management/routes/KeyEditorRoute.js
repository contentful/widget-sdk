import React from 'react';
import PropTypes from 'prop-types';
import { getApiKeyRepo } from '../services/ApiKeyRepoInstance';
import { RouteNavigate, useParams } from 'core/react-routing';
import createFetcherComponent from 'app/common/createFetcherComponent';
import * as accessChecker from 'access_control/AccessChecker';
import { KeyEditorWorkbench } from '../api-key-editor/KeyEditorWorkbench';
import { KeyEditor } from '../api-key-editor/KeyEditor';
import { getVariation, FLAGS } from 'core/feature-flags';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isAdmin } from 'core/services/SpaceEnvContext/utils';

const ApiKeyFetcher = createFetcherComponent(
  async ({ spaceId, organizationId, apiKeyId, spaceEnvironmentsRepo }) => {
    const [
      apiKey,
      canEdit,
      shouldDisableCreate,
      environmentsEnabled,
      { environments: spaceEnvironments, aliases: spaceAliases },
    ] = await Promise.all([
      getApiKeyRepo().get(apiKeyId),
      accessChecker.canModifyApiKeys(),
      accessChecker.shouldDisable('create', 'apiKey'),
      getVariation(FLAGS.ENVIRONMENTS_FLAG, { spaceId, organizationId }),
      spaceEnvironmentsRepo.getAll(),
    ]);
    return {
      apiKey,
      canEdit,
      canCreate: !shouldDisableCreate,
      environmentsEnabled,
      spaceAliases,
      spaceEnvironments,
    };
  }
);

export function KeyEditorRoute(props) {
  const {
    currentSpaceId: spaceId,
    currentOrganizationId: organizationId,
    currentSpace,
  } = useSpaceEnvContext();
  const isSpaceAdmin = isAdmin(currentSpace);
  const { apiKeyId } = useParams();

  return (
    <ApiKeyFetcher
      spaceId={spaceId}
      organizationId={organizationId}
      apiKeyId={apiKeyId}
      spaceEnvironmentsRepo={props.spaceEnvironmentsRepo}>
      {({ isLoading, isError, data }) => {
        if (isLoading) {
          return <KeyEditorWorkbench />;
        }
        if (isError) {
          return <RouteNavigate replace route={{ path: 'api.keys.list' }} />;
        }
        return (
          <KeyEditor
            {...props}
            isAdmin={isSpaceAdmin}
            apiKey={data.apiKey}
            canEdit={data.canEdit}
            canCreate={data.canCreate}
            spaceAliases={data.spaceAliases}
            spaceEnvironments={data.spaceEnvironments}
            environmentsEnabled={data.environmentsEnabled}
            setDirty={props.setDirty}
            registerSaveAction={props.registerSaveAction}
          />
        );
      }}
    </ApiKeyFetcher>
  );
}

KeyEditorRoute.propTypes = {
  registerSaveAction: PropTypes.func.isRequired,
  setDirty: PropTypes.func.isRequired,
  spaceEnvironmentsRepo: PropTypes.object.isRequired,
  spaceAliasesRepo: PropTypes.object.isRequired,
};
