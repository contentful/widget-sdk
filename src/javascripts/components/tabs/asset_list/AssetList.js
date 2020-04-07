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
  const defaultColSpan = 4;
  const displayedFields = [
    {
      id: 'file',
      name: 'Preview',
      colSpan: 2,
    },
    {
      id: 'title',
      name: 'Name',
      colSpan: 6,
    },
    {
      id: 'dimensions',
      name: 'Dimensions',
      colSpan: defaultColSpan,
    },
    {
      id: 'fileType',
      name: 'Type',
      colSpan: defaultColSpan,
    },
    {
      id: 'updatedAt',
      name: 'Updated',
      colSpan: defaultColSpan,
    },
    {
      id: 'updatedBy',
      name: 'By',
      colSpan: defaultColSpan,
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
      statusColSpan={defaultColSpan}
      updateEntities={updateAssets}
    />
  );
}

AssetList.propTypes = {
  context: PropTypes.object.isRequired,
  assets: PropTypes.array,
  updateAssets: PropTypes.func.isRequired,
};
