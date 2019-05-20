import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer.es6';
import { Heading, Paragraph } from '@contentful/forma-36-react-components';
import AddAssetButton from './AddAssetButton.es6';
import MediaEmptyStateIllustration from 'svg/media-empty-state.es6';

const styles = { svgContainer: css({ width: '280px' }) };

const AssetsEmptyState = ({ canUploadMultipleAssets, createMultipleAssets, newAsset }) => {
  return (
    <EmptyStateContainer>
      <div className={styles.svgContainer}>
        <MediaEmptyStateIllustration />
      </div>
      <Heading>Your media will hang here</Heading>
      <Paragraph>
        Media assets you upload will show up here. Start by uploading your first one.
      </Paragraph>
      <AddAssetButton
        canUploadMultipleAssets={canUploadMultipleAssets}
        createMultipleAssets={createMultipleAssets}
        newAsset={newAsset}
        testId="add-asset-menu-trigger-empty-state"
      />
    </EmptyStateContainer>
  );
};

AssetsEmptyState.propTypes = {
  canUploadMultipleAssets: PropTypes.func.isRequired,
  createMultipleAssets: PropTypes.func.isRequired,
  newAsset: PropTypes.func.isRequired
};

export default AssetsEmptyState;
