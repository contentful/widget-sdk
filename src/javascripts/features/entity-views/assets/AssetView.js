import React, { useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { AddAssetButton } from './AddAssetButton';
import { AssetList } from './AssetList';
import { useListView } from 'features/entity-search';
import { ListQuery } from 'core/services/ContentQuery';
import { shouldDisable, canUploadMultipleAssets, Action } from 'access_control/AccessChecker';
import * as Analytics from 'analytics/Analytics';
import * as entityCreator from 'components/app_container/entityCreator';
import { Notification } from '@contentful/forma-36-react-components';
import TheLocaleStore from 'services/localeStore';
import * as BulkAssetsCreator from 'services/BulkAssetsCreator';
import { AssetsEmptyState } from './AssetsEmptyState';
import { delay, get } from 'lodash';
import { EntitiesView } from '../core/EntitiesView';
import { FileSizeLimitWarning } from './FileSizeLimitWarning';
import { shouldHide } from 'access_control/AccessChecker';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';
import { ScheduledActionsPageLink } from 'app/ScheduledActions';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import * as ScheduledActionsService from 'app/ScheduledActions/DataManagement/ScheduledActionsService';

const trackEnforcedButtonClick = (err) => {
  // If we get reason(s), that means an enforcement is present
  const reason = get(err, 'body.details.reasons', null);

  Analytics.track('entity_button:click', {
    entityType: 'asset',
    enforced: Boolean(reason),
    reason,
  });
};

const newAsset = (goTo) => async () => {
  Analytics.track('asset_list:add_asset_single');
  try {
    const asset = await entityCreator.newAsset();
    goTo(asset.getId());
  } catch (err) {
    // Throw err so the UI can also display it
    trackEnforcedButtonClick(err);
    throw err;
  }
};

const createMultipleAssets = (updateEntities) => async () => {
  Analytics.track('asset_list:add_asset_multiple');
  const defaultLocaleCode = TheLocaleStore.getDefaultLocale().internal_code;
  try {
    await BulkAssetsCreator.open(defaultLocaleCode);
  } finally {
    // We reload all assets to get the new ones. Unfortunately the
    // CMA is not immediately consistent so we have to wait.
    // TODO Instead of querying the collection endpoint we should
    // add the assets manually. This is currently not possible as the
    // asset's `process` endpoint doesn't give us the final `url`.
    delay(async () => {
      await updateEntities();
      Notification.success('Updated asset list');
    }, 5000);
  }
};

export const AssetView = ({ goTo }) => {
  const entityType = 'asset';
  const {
    currentEnvironmentId,
    currentOrganization,
    currentOrganizationId,
    currentSpace,
    currentSpaceData,
    currentSpaceId,
  } = useSpaceEnvContext();
  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);
  const listViewContext = useListView({ entityType, isPersisted: true });
  const [scheduledActions, setScheduledActions] = useState([]);
  const fetchAssets = useCallback((query) => currentSpace.getAssets(query), [currentSpace]);

  const searchControllerProps = {
    keys: {
      search: ['searchText', 'searchFilters'],
      query: ['searchText', 'searchFilters'],
    },
    getListQuery: ListQuery.getForAssets,
  };

  useEffect(() => {
    const init = async () => {
      try {
        const spaceEndpoint = createSpaceEndpoint(currentSpaceId, currentEnvironmentId);
        const { items = [] } = await ScheduledActionsService.getJobs(spaceEndpoint, {
          order: 'scheduledFor.datetime',
          'sys.status': 'scheduled',
          'environment.sys.id': currentEnvironmentId,
        });
        setScheduledActions(items);
      } catch (items) {
        // ignore error
      }
    };
    init();
  }, [currentSpaceId, currentEnvironmentId]);

  return (
    <EntitiesView
      title="Media"
      entityType={entityType}
      environmentId={currentEnvironmentId}
      space={currentSpaceData}
      organization={currentOrganization}
      isMasterEnvironment={isMasterEnvironment}
      fetchEntities={fetchAssets}
      listViewContext={listViewContext}
      searchControllerProps={searchControllerProps}
      renderTopContent={() => (
        <FileSizeLimitWarning organizationId={currentOrganizationId} spaceId={currentSpaceId} />
      )}
      renderAddEntityActions={({ updateEntities }, className) => {
        if (shouldHide('create', entityType)) return null;
        return (
          <AddAssetButton
            className={className}
            testId="add-asset-menu-trigger"
            canUploadMultipleAssets={canUploadMultipleAssets}
            createMultipleAssets={createMultipleAssets(updateEntities)}
            newAsset={newAsset(goTo)}
            disabled={shouldDisable(Action.CREATE, entityType)}
          />
        );
      }}
      renderSavedViewsActions={() => (
        <ScheduledActionsPageLink isMasterEnvironment={isMasterEnvironment} />
      )}
      renderEmptyState={({ updateEntities }, className) => (
        <AssetsEmptyState
          className={className}
          canUploadMultipleAssets={canUploadMultipleAssets}
          createMultipleAssets={createMultipleAssets(updateEntities)}
          newAsset={newAsset(goTo)}
        />
      )}
      renderEntityList={({ entities, isLoading, updateEntities }, className) => (
        <AssetList
          className={className}
          assets={entities}
          isLoading={isLoading}
          scheduledActions={scheduledActions}
          updateAssets={() => updateEntities()}
        />
      )}
    />
  );
};

AssetView.propTypes = {
  goTo: PropTypes.func.isRequired,
};
