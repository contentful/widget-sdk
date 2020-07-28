import React from 'react';
import PropTypes from 'prop-types';
import { getApiKeyRepo } from '../services/ApiKeyRepoInstance';
import StateRedirect from 'app/common/StateRedirect';
import createFetcherComponent from 'app/common/createFetcherComponent';
import * as accessChecker from 'access_control/AccessChecker';
import { KeyEditorWorkbench } from '../api-key-editor/KeyEditorWorkbench';
import { KeyEditor } from '../api-key-editor/KeyEditor';
import { getVariation } from 'LaunchDarkly';
import { getModule } from 'core/NgRegistry';

import { ENVIRONMENTS_FLAG } from 'featureFlags';

const ApiKeyFetcher = createFetcherComponent(async ({ apiKeyId, spaceEnvironmentsRepo }) => {
  const spaceContext = getModule('spaceContext');
  const spaceId = spaceContext.getId();
  const organizationId = spaceContext.organization.sys.id;

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
    getVariation(ENVIRONMENTS_FLAG, { spaceId, organizationId }),
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
});

export function KeyEditorRoute(props) {
  return (
    <ApiKeyFetcher apiKeyId={props.apiKeyId} spaceEnvironmentsRepo={props.spaceEnvironmentsRepo}>
      {({ isLoading, isError, data }) => {
        if (isLoading) {
          return <KeyEditorWorkbench />;
        }
        if (isError) {
          return <StateRedirect path="^.list" />;
        }
        return (
          <KeyEditor
            {...props}
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
  apiKeyId: PropTypes.string.isRequired,
  registerSaveAction: PropTypes.func.isRequired,
  setDirty: PropTypes.func.isRequired,
  spaceEnvironmentsRepo: PropTypes.object.isRequired,
  spaceAliasesRepo: PropTypes.object.isRequired,
};
