import React from 'react';
import PropTypes from 'prop-types';
import { EmptyState } from '@contentful/forma-36-react-components';
import AddAssetButton from './AddAssetButton.es6';
import MediaEmptyStateIllustration from 'svg/media-empty-state.es6';

const AssetsEmptyState = ({ canUploadMultipleAssets, createMultipleAssets, newAsset }) => {
  return (
    <EmptyState
      customImageElement={
        <div style={{ width: '280px' }}>
          <MediaEmptyStateIllustration />
        </div>
      }
      headingProps={{ text: 'Your media will hang here' }}
      descriptionProps={{
        text: 'Media assets you upload will show up here. Start by uploading your first one.'
      }}>
      <AddAssetButton
        canUploadMultipleAssets={canUploadMultipleAssets}
        createMultipleAssets={createMultipleAssets}
        newAsset={newAsset}
        testId="add-asset-menu-trigger-empty-state"
      />
    </EmptyState>
  );
};

AssetsEmptyState.propTypes = {
  canUploadMultipleAssets: PropTypes.func.isRequired,
  createMultipleAssets: PropTypes.func.isRequired,
  newAsset: PropTypes.func.isRequired
};

export default AssetsEmptyState;
