import * as React from 'react';
import { AssetView } from '../AssetView';
import { CustomRouter, RouteErrorBoundary, Route, Routes } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';

const AssetListRouter = () => {
  const [basename] = window.location.pathname.split('assets');
  return (
    <CustomRouter splitter="assets">
      <RouteErrorBoundary>
        <Routes basename={basename + 'assets'}>
          <Route name="spaces.detail.assets.list" path="/" element={<AssetView />} />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};

export const assetListState = {
  name: 'list',
  url: '',
  component: AssetListRouter,
};
