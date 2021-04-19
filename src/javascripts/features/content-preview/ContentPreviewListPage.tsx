import React from 'react';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { Workbench } from '@contentful/forma-36-react-components';
import { WhatIsContentPreview } from './ContentPreviewSidebar';
import { CreatePreviewButton } from './CreatePreviewButton';
import { ContentPreviewList } from './ContentPreviewList';
import { ContentPreview } from './types';

export function ContentPreviewListPage({ contentPreviews }: { contentPreviews: ContentPreview[] }) {
  return (
    <Workbench>
      <Workbench.Header
        icon={<ProductIcon icon="Settings" size="large" />}
        title="Content preview"
        actions={<CreatePreviewButton />}
      />
      <Workbench.Content type="full">
        <ContentPreviewList contentPreviews={contentPreviews} />
      </Workbench.Content>
      <Workbench.Sidebar position="right">
        <WhatIsContentPreview />
      </Workbench.Sidebar>
    </Workbench>
  );
}
