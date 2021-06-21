import * as React from 'react';
import { CustomRouter, RouteErrorBoundary, Route, Routes } from 'core/react-routing';
import ErrorPage from './ErrorPage';
import EmptyNavigationBar from 'navigation/EmptyNavigationBar';
import { StateTitle } from 'navigation/Sidepanel/SidePanelTrigger/SidePanelTrigger';
import StateRedirect from 'app/common/StateRedirect';

const ErrorRouter = () => {
  const [basename] = window.location.pathname.split('error');

  return (
    <CustomRouter splitter="error">
      <RouteErrorBoundary>
        <Routes basename={basename + 'error'}>
          <Route name="error" path="/" element={<ErrorPage />} />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};

export const errorState = {
  name: 'error',
  url: '/error{pathname:any}',
  navComponent: () => {
    return <EmptyNavigationBar triggerText={<StateTitle title="Switch space" />} />;
  },
  component: ErrorRouter,
};
