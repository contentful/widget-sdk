import React from 'react';
import PropTypes from 'prop-types';

import EntityList from '../EntityList';
import DisplayField from './DisplayField';
import { css } from 'emotion';

const styles = {
  table: css({
    '& td': {
      verticalAlign: 'middle',
    },
  }),
};

// Adapter react/angular
const AssetListAdapter = ({ getAssets, ...props }) => {
  const assets = getAssets();
  return <AssetList {...props} assets={assets} />;
};

AssetListAdapter.propTypes = {
  getAssets: PropTypes.func.isRequired,
};
export default AssetListAdapter;

function AssetList({ context, assets = [], updateAssets }) {
  const displayedFields = [
    {
      id: 'file',
      name: 'Preview',
      colWidth: '8%',
    },
    {
      id: 'title',
      name: 'Name',
      colWidth: '20%',
    },
    {
      id: 'dimensions',
      name: 'Dimensions',
    },
    {
      id: 'fileType',
      name: 'Type',
    },
    {
      id: 'updatedAt',
      name: 'Updated',
    },
    {
      id: 'updatedBy',
      name: 'By',
    },
  ];

  return (
    <EntityList
      className={styles.table}
      displayedFields={displayedFields}
      entities={assets}
      entityType="asset"
      isLoading={context.isSearching}
      renderDisplayField={(props) => <DisplayField {...props} />}
      updateEntities={updateAssets}
    />
  );
}

AssetList.propTypes = {
  context: PropTypes.object.isRequired,
  assets: PropTypes.array,
  updateAssets: PropTypes.func.isRequired,
};
