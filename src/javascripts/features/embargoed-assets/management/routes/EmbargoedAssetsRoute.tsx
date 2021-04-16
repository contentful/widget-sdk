import DocumentTitle from 'components/shared/DocumentTitle';
import React from 'react';
import { Workbench } from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { EmbargoedAssets } from '../components/EmbargoedAssets';

function EmbargoedAssetsRoute() {
  return (
    <>
      <DocumentTitle title="Embargoed assets" />
      <Workbench>
        <Workbench.Header
          title={'Embargoed assets'}
          icon={<ProductIcon icon="Settings" size="large" tag="span" />}
        />
        <Workbench.Content type="text" className="embargoed-assets-workbench-content">
          <EmbargoedAssets />
        </Workbench.Content>
      </Workbench>
    </>
  );
}

export { EmbargoedAssetsRoute };
