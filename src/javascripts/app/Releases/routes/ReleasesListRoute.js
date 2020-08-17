import React from 'react';

import StateRedirect from 'app/common/StateRedirect';
import { useFeatureFlagAddToRelease } from '../ReleasesFeatureFlag';
import ReleasesListPage from '../ReleasesPage/ReleasesListPage';

const ReleasesListRoute = () => {
  const { addToReleaseEnabled, isAddToReleaseLoading } = useFeatureFlagAddToRelease();

  if (isAddToReleaseLoading) {
    return null;
  }
  if (addToReleaseEnabled === true) {
    return <ReleasesListPage />;
  } else {
    return <StateRedirect path="spaces.detail.entries.list" />;
  }
};

export default ReleasesListRoute;
