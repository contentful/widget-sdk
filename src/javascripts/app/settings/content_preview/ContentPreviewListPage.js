import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Icon from 'ui/Components/Icon';
import { SkeletonContainer, SkeletonBodyText } from '@contentful/forma-36-react-components';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import { WhatIsContentPreview } from './ContentPreviewSidebar';
import CreatePreviewButton from './CreatePreviewButton';
import ContentPreviewList from './ContentPreviewList';

export const ContentPreviewListPageSkeleton = () => (
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
    <Workbench.Sidebar position="right">
      <WhatIsContentPreview />
    </Workbench.Sidebar>
  </Workbench>
);

export default class ContentPreviewListPage extends Component {
  static propTypes = {
    contentPreviews: PropTypes.arrayOf(
      PropTypes.shape({
        sys: PropTypes.shape({
          id: PropTypes.string.isRequired
        }).isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired
      })
    ).isRequired
  };

  render() {
    const { contentPreviews } = this.props;
    return (
      <Workbench>
        <Workbench.Header
          icon={<Icon name="page-settings" scale="0.8" />}
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
}
