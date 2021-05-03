import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import React from 'react';

async function importer() {
  return await import(/* webpackChunkName: "app-bundles" */ './AppBundles');
}

export const LazyLoadedAppBundles = () => (
  <LazyLoadedComponent importer={importer}>
    {({ AppBundles }) => <AppBundles />}
  </LazyLoadedComponent>
);
