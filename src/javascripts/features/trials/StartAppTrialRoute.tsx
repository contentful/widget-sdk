import React from 'react';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { useNavigationState } from 'core/react-routing';

async function importer() {
  return await import(/* webpackChunkName: "organization-settings" */ './components/StartAppTrial');
}

export const StartAppTrialRoute = (props: { orgId: string }) => {
  const navigationState =
    useNavigationState<{
      from?: string;
      existingUsers: boolean;
    }>();
  return (
    <LazyLoadedComponent importer={importer}>
      {({ StartAppTrial }) => {
        return <StartAppTrial {...navigationState} {...props} />;
      }}
    </LazyLoadedComponent>
  );
};
