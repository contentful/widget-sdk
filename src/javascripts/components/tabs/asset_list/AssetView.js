import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import AddAssetButton from './AddAssetButton';
import AssetList from './AssetList';
import * as ListQuery from 'search/listQuery';
import { shouldDisable, canUploadMultipleAssets, Action } from 'access_control/AccessChecker';
import * as Analytics from 'analytics/Analytics';
import * as entityCreator from 'components/app_container/entityCreator';
import { Notification } from '@contentful/forma-36-react-components';
import TheLocaleStore from 'services/localeStore';
import * as BulkAssetsCreator from 'services/BulkAssetsCreator';
import AssetsEmptyState from './AssetsEmptyState';
import { delay, get } from 'lodash';
import EntitiesView from '../EntitiesView';
import useListView from 'app/ContentList/Search/useListView';
import { getModule } from 'core/NgRegistry';
import FileSizeLimitWarning from './FileSizeLimitWarning';

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

const Assets = ({ goTo }) => {
  const entityType = 'asset';
  const spaceContext = useMemo(() => getModule('spaceContext'), []);
  const listViewContext = useListView({ entityType, isPersisted: true });
  const fetchAssets = useCallback((query) => spaceContext.space.getAssets(query), [spaceContext]);

  return (
    <EntitiesView
      title="Media"
      entityType={entityType}
      spaceContext={spaceContext}
      fetchEntities={fetchAssets}
      listViewContext={listViewContext}
      getContentTypes={spaceContext.publishedCTs.getAllBare}
      searchControllerProps={{
        searchKeys: ['searchText', 'searchFilters'],
        queryKeys: ['searchText', 'searchFilters'],
        getListQuery: ListQuery.getForAssets,
      }}
      renderTopContent={() => (
        <FileSizeLimitWarning
          organizationId={spaceContext.organization.sys.id}
          spaceId={spaceContext.space.data.sys.id}
        />
      )}
      renderAddEntityActions={({ updateEntities }, className) => (
        <AddAssetButton
          className={className}
          testId="add-asset-menu-trigger"
          canUploadMultipleAssets={canUploadMultipleAssets}
          createMultipleAssets={createMultipleAssets(updateEntities)}
          newAsset={newAsset(goTo)}
          disabled={shouldDisable(Action.CREATE, entityType)}
        />
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
          updateAssets={() => updateEntities()}
        />
      )}
    />
  );
};

Assets.propTypes = {
  goTo: PropTypes.func.isRequired,
};

export default Assets;
