import React from 'react';
import {
  SkeletonContainer,
  SkeletonBodyText,
  Workbench,
} from '@contentful/forma-36-react-components';
import NavigationIcon from 'ui/Components/NavigationIcon';

export function LocalesListSkeleton() {
  return (
    <Workbench testId="locale-list-workbench">
      <Workbench.Header
        icon={<NavigationIcon icon="settings" color="green" size="large" />}
        title="Locales"
      />
      <Workbench.Content type="full">
        <SkeletonContainer
          svgWidth={600}
          svgHeight={300}
          ariaLabel="Loading locales..."
          clipId="loading-locales-list">
          <SkeletonBodyText numberOfLines={5} offsetLeft={20} marginBottom={15} offsetTop={20} />
        </SkeletonContainer>
      </Workbench.Content>
    </Workbench>
  );
}
