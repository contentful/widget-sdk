import React from 'react';
import GetStartedScreen from 'components/shared/stack-onboarding/screens/GetStartedScreen';
import CopyScreen from 'components/shared/stack-onboarding/screens/CopyScreen';
import ExploreScreen from 'components/shared/stack-onboarding/screens/ExploreScreen';
import DeployScreen from 'components/shared/stack-onboarding/screens/DeployScreen';
import OnboardingRoute from 'components/shared/stack-onboarding/OnboardingRoute';

const getStarted = {
  name: 'getStarted',
  url: '/get-started',
  component: () => (
    <OnboardingRoute>
      <GetStartedScreen />
    </OnboardingRoute>
  ),
};

const copyRepo = {
  name: 'copy',
  url: '/copy',
  component: () => (
    <OnboardingRoute>
      <CopyScreen />
    </OnboardingRoute>
  ),
};

const explore = {
  name: 'explore',
  url: '/explore',
  component: () => (
    <OnboardingRoute>
      <ExploreScreen />
    </OnboardingRoute>
  ),
};

const deploy = {
  name: 'deploy',
  url: '/deploy',
  component: () => (
    <OnboardingRoute>
      <DeployScreen />
    </OnboardingRoute>
  ),
};

export default {
  name: 'onboarding',
  url: '/onboarding',
  abstract: true,
  component: OnboardingRoute,
  children: [getStarted, copyRepo, explore, deploy],
};
