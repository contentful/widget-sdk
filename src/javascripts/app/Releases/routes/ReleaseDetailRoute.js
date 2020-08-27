import React from 'react';
import PropTypes from 'prop-types';
import StateRedirect from 'app/common/StateRedirect';
import { useFeatureFlagAddToRelease } from '../ReleasesFeatureFlag';
import ReleaseDetailPageContainer from '../ReleaseDetail/ReleaseDetailPageContainer';

const ReleaseDetailRoute = ({ releaseId, defaultLocale, isMasterEnvironment }) => {
  const { addToReleaseEnabled, isAddToReleaseLoading } = useFeatureFlagAddToRelease();

  if (isAddToReleaseLoading) {
    return null;
  }
  if (addToReleaseEnabled === true) {
    return (
      <ReleaseDetailPageContainer
        releaseId={releaseId}
        defaultLocale={defaultLocale}
        isMasterEnvironment={isMasterEnvironment}
      />
    );
  } else {
    return <StateRedirect path="spaces.detail.entries.list" />;
  }
};

ReleaseDetailRoute.propTypes = {
  defaultLocale: PropTypes.object.isRequired,
  releaseId: PropTypes.string.isRequired,
  isMasterEnvironment: PropTypes.bool.isRequired,
};

export default ReleaseDetailRoute;
