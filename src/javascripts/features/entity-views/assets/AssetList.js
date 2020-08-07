import React from 'react';
import PropTypes from 'prop-types';
import { EntityList } from '../core/EntityList';
import { DisplayField } from './DisplayField';
import { css } from 'emotion';

const styles = {
  table: css({
    '& td': {
      verticalAlign: 'middle',
    },
  }),
};

export function AssetList({ isLoading, assets = [], updateAssets }) {
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
      isLoading={isLoading}
      renderDisplayField={(props) => <DisplayField {...props} />}
      updateEntities={updateAssets}
    />
  );
}

AssetList.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  assets: PropTypes.array,
  updateAssets: PropTypes.func.isRequired,
};
