import DocumentTitle from 'components/shared/DocumentTitle';
import React, { useState } from 'react';
import { Workbench } from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';

import { EnabledFeature } from '../components/EnabledFeature';
import { DisabledFeature } from '../components/DisabledFeature';
import { LEVEL } from '../constants';

function EmbargoedAssetsRoute() {
  const [currentLevel, setCurrentLevel] = useState<LEVEL>(LEVEL.DISABLED);

  // @todo check PC space feature flag "embargoed assets":
  // <DisabledFeature />

  return (
    <>
      <DocumentTitle title="Embargoed Assets" />
      <Workbench.Header
        title={'Embargoed assets'}
        icon={<ProductIcon icon="Settings" size="large" tag={'span'} />}
      />
      <Workbench.Content type="text" className={'embargoed-assets-workbench-content'}>
        {currentLevel ? (
          <EnabledFeature currentLevel={currentLevel} setCurrentLevel={setCurrentLevel} />
        ) : (
          <DisabledFeature setCurrentLevel={setCurrentLevel} />
        )}
      </Workbench.Content>
    </>
  );
}

const embargoedAssetsState = {
  name: 'embargoedAssets',
  url: '/embargoed-assets',
  component: (props) => <EmbargoedAssetsRoute {...props} />,
};

export { EmbargoedAssetsRoute, embargoedAssetsState };
