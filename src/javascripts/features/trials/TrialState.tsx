import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { StartAppTrialProps } from './components/StartAppTrial';

async function importer() {
  return await import(/* webpackChunkName: "organization-settings" */ './components/StartAppTrial');
}

export const trialState = {
  name: 'start_trial',
  url: '/start_trial',
  params: {
    existingUsers: false,
  },
  component: withOrganizationRoute((props: StartAppTrialProps) => (
    <LazyLoadedComponent importer={importer}>
      {({ StartAppTrial }) => {
        return <StartAppTrial {...props} />;
      }}
    </LazyLoadedComponent>
  )),
};
