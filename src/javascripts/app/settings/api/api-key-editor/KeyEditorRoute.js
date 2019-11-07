import React from 'react';
import PropTypes from 'prop-types';
import { getApiKeyRepo } from 'app/settings/api/services/ApiKeyRepoInstance';
import StateRedirect from 'app/common/StateRedirect.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import * as accessChecker from 'access_control/AccessChecker';
import KeyEditorWorkbench from './KeyEditorWorkbench';
import KeyEditor from './KeyEditor';
import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';

import { ENVIRONMENTS_FLAG } from 'featureFlags.es6';

const ApiKeyFetcher = createFetcherComponent(async ({ apiKeyId, spaceEnvironmentsRepo }) => {
  const [
    apiKey,
    canEdit,
    shouldDisableCreate,
    environmentsEnabled,
    { environments: spaceEnvironments, aliases: spaceAliases }
  ] = await Promise.all([
    getApiKeyRepo().get(apiKeyId),
    accessChecker.canModifyApiKeys(),
    accessChecker.shouldDisable('create', 'apiKey'),
    getCurrentVariation(ENVIRONMENTS_FLAG),
    spaceEnvironmentsRepo.getAll()
  ]);
  return {
    apiKey,
    canEdit,
    canCreate: !shouldDisableCreate,
    environmentsEnabled,
    spaceAliases,
    spaceEnvironments
  };
});

export default function KeyEditorRoute(props) {
  return (
    <ApiKeyFetcher apiKeyId={props.apiKeyId} spaceEnvironmentsRepo={props.spaceEnvironmentsRepo}>
      {({ isLoading, isError, data }) => {
        if (isLoading) {
          return <KeyEditorWorkbench />;
        }
        if (isError) {
          return <StateRedirect to="^.list" />;
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
  spaceAliasesRepo: PropTypes.object.isRequired
};
