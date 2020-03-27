import React from 'react';

import {
  SkeletonContainer,
  SkeletonBodyText,
  Workbench,
} from '@contentful/forma-36-react-components';

export const ContentPreviewListSkeleton = () => (
  <Workbench>
    <Workbench.Header>
      <Workbench.Icon icon="page-settings" />
      <Workbench.Title>Content preview</Workbench.Title>
    </Workbench.Header>
    <Workbench.Content type="full">
      <SkeletonContainer
        svgWidth={600}
        svgHeight={300}
        ariaLabel="Loading content preview..."
        clipId="loading-content-preview">
        <SkeletonBodyText numberOfLines={5} offsetLeft={20} marginBottom={15} offsetTop={20} />
      </SkeletonContainer>
    </Workbench.Content>
    <Workbench.Sidebar position="right" />
  </Workbench>
);
