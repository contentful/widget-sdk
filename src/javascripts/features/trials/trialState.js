import React from 'react';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';

async function importer() {
  return await import(/* webpackChunkName: "organization-settings" */ './components/StartAppTrial');
}

export const trialState = {
  name: 'start_trial',
  url: '/start_trial?{existingUsers:bool}',
  params: {
    existingUsers: false,
  },
  component: (props) => (
    <LazyLoadedComponent importer={importer}>
      {({ StartAppTrial }) => {
        return <StartAppTrial {...props} />;
      }}
    </LazyLoadedComponent>
  ),
};
