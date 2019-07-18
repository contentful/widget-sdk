import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Icon from 'ui/Components/Icon.es6';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import { WhatIsContentPreview } from './ContentPreviewSidebar.es6';
import CreatePreviewButton from './CreatePreviewButton.es6';
import ContentPreviewList from './ContentPreviewList.es6';

export const ContentPreviewListPageSkeleton = () => (
  <Workbench>
    <Workbench.Header>
      <Workbench.Icon icon="page-settings" />
      <Workbench.Title>Content preview</Workbench.Title>
    </Workbench.Header>
    <Workbench.Content />
    <Workbench.Sidebar>
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
        />
        <Workbench.Content type="full">
          <ContentPreviewList contentPreviews={contentPreviews} />
        </Workbench.Content>
        <Workbench.Sidebar position="right">
          <CreatePreviewButton />
          <WhatIsContentPreview />
        </Workbench.Sidebar>
      </Workbench>
    );
  }
}
