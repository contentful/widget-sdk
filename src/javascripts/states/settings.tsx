import SpaceSettingsBase from 'states/SpaceSettingsBase';
import * as React from 'react';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';

async function importer() {
  return await import(/* webpackChunkName: "space-settings" */ './routers/SettingsRouter');
}

const LazyLoadedSettings = () => (
  <LazyLoadedComponent importer={importer}>
    {({ SettingsRouter }) => <SettingsRouter />}
  </LazyLoadedComponent>
);

export default SpaceSettingsBase({
  name: 'settings',
  url: '/settings{pathname:any}',
  component: LazyLoadedSettings,
  params: {
    navigationState: null,
  },
});
