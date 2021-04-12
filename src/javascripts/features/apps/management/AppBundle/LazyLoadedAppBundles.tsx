import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import React from 'react';
import { AppBundlesProps } from './AppBundles';

async function importer() {
  return await import(/* webpackChunkName: "app-bundles" */ './AppBundles');
}

export const LazyLoadedAppBundles = (props: AppBundlesProps) => (
  <LazyLoadedComponent importer={importer}>
    {({ AppBundles }) => <AppBundles {...props} />}
  </LazyLoadedComponent>
);
