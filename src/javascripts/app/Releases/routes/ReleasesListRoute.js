import React from 'react';

import StateRedirect from 'app/common/StateRedirect';
import ReleasesFeatureFlag from '../ReleasesFeatureFlag';
import ReleasesListPage from '../ReleasesPage/ReleasesListPage';

const ReleasesListRoute = () => (
  <ReleasesFeatureFlag>
    {({ currentVariation }) => {
      if (currentVariation === true) {
        return <ReleasesListPage />;
      } else if (currentVariation === false) {
        return <StateRedirect path="spaces.detail.entries.list" />;
      } else {
        return null;
      }
    }}
  </ReleasesFeatureFlag>
);

export default ReleasesListRoute;
