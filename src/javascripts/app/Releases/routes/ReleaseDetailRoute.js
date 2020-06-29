import React from 'react';
import PropTypes from 'prop-types';
import StateRedirect from 'app/common/StateRedirect';
import ReleasesFeatureFlag from '../ReleasesFeatureFlag';
import ReleaseDetailPageContainer from '../ReleaseDetail/ReleaseDetailPageContainer';

const ReleaseDetailRoute = ({ releaseId, defaultLocale }) => (
  <ReleasesFeatureFlag>
    {({ currentVariation }) => {
      if (currentVariation === true) {
        return <ReleaseDetailPageContainer releaseId={releaseId} defaultLocale={defaultLocale} />;
      } else if (currentVariation === false) {
        return <StateRedirect path="spaces.detail.entries.list" />;
      } else {
        return null;
      }
    }}
  </ReleasesFeatureFlag>
);

ReleaseDetailRoute.propTypes = {
  defaultLocale: PropTypes.object.isRequired,
  releaseId: PropTypes.string.isRequired,
};

export default ReleaseDetailRoute;
