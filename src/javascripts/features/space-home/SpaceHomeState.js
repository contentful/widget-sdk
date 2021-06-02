import React from 'react';
import { SpaceHome } from './SpaceHome';
import { CustomRouter, RouteErrorBoundary, Route, Routes } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';

const SpaceHomeRouter = () => {
  const [basename] = window.location.pathname.split('home');

  return (
    <CustomRouter splitter="home">
      <RouteErrorBoundary>
        <Routes basename={basename + 'home'}>
          <Route name="spaces.detail.home" path="/" element={<SpaceHome />} />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};

export const spaceHomeState = {
  name: 'home',
  url: '/home{pathname:any}',
  component: SpaceHomeRouter,
};
