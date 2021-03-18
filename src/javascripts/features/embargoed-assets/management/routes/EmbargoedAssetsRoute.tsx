import DocumentTitle from 'components/shared/DocumentTitle';
import React from 'react';
import { Workbench } from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { EmbargoedAssets } from '../components/EmbargoedAssets';

function EmbargoedAssetsRoute() {
  return (
    <>
      <DocumentTitle title="Embargoed assets" />
      <Workbench.Header
        title={'Embargoed assets'}
        icon={<ProductIcon icon="Settings" size="large" tag={'span'} />}
      />
      <Workbench.Content type="text" className={'embargoed-assets-workbench-content'}>
        <EmbargoedAssets />
      </Workbench.Content>
    </>
  );
}

const embargoedAssetsState = {
  name: 'embargoedAssets',
  url: '/embargoed-assets',
  component: (props) => (
    <SpaceEnvContextProvider>
      <EmbargoedAssetsRoute {...props} />
    </SpaceEnvContextProvider>
  ),
};

export { EmbargoedAssetsRoute, embargoedAssetsState };
