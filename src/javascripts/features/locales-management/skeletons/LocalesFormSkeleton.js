import React from 'react';
import { noop } from 'lodash';
import {
  SkeletonContainer,
  SkeletonBodyText,
  Workbench,
} from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';

export function LocalesFormSkeleton() {
  return (
    <Workbench>
      <Workbench.Header onBack={noop} icon={<ProductIcon icon="Settings" size="large" />} />
      <Workbench.Content>
        <SkeletonContainer
          svgWidth={600}
          svgHeight={300}
          ariaLabel="Loading locale..."
          clipId="loading-locale">
          <SkeletonBodyText numberOfLines={5} offsetLeft={20} marginBottom={15} offsetTop={20} />
        </SkeletonContainer>
      </Workbench.Content>
    </Workbench>
  );
}
