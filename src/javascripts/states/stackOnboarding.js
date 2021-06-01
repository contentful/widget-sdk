import React from 'react';
import GetStartedScreen from 'components/shared/stack-onboarding/screens/GetStartedScreen';
import CopyScreen from 'components/shared/stack-onboarding/screens/CopyScreen';
import ExploreScreen from 'components/shared/stack-onboarding/screens/ExploreScreen';
import DeployScreen from 'components/shared/stack-onboarding/screens/DeployScreen';
import OnboardingRoute from 'components/shared/stack-onboarding/OnboardingRoute';
import { CustomRouter, RouteErrorBoundary, Route, Routes } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';

const OnboardingRouter = () => {
  const [basename] = window.location.pathname.split('onboarding');

  return (
    <CustomRouter splitter="onboarding">
      <RouteErrorBoundary>
        <Routes basename={basename + 'onboarding'}>
          <Route
            name="spaces.detail.onboarding.getStarted"
            path="/getStarted"
            element={
              <OnboardingRoute>
                <GetStartedScreen />
              </OnboardingRoute>
            }
          />
          <Route
            name="spaces.detail.onboarding.copy"
            path="/copy"
            element={
              <OnboardingRoute>
                <CopyScreen />
              </OnboardingRoute>
            }
          />
          <Route
            name="spaces.detail.onboarding.explore"
            path="/explore"
            element={
              <OnboardingRoute>
                <ExploreScreen />
              </OnboardingRoute>
            }
          />
          <Route
            name="spaces.detail.onboarding.deploy"
            path="/deploy"
            element={
              <OnboardingRoute>
                <DeployScreen />
              </OnboardingRoute>
            }
          />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};

const stackOnboardingState = {
  name: 'onboarding',
  url: '/onboarding{pathname:any}',
  component: OnboardingRouter,
};

export default stackOnboardingState;
