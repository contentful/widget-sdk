import React, { Component } from 'react';
import PropTypes from 'prop-types';
import NavigationIcon from 'ui/Components/NavigationIcon';
import { Workbench } from '@contentful/forma-36-react-components';
import { WhatIsContentPreview } from './ContentPreviewSidebar';
import CreatePreviewButton from './CreatePreviewButton';
import ContentPreviewList from './ContentPreviewList';

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
          icon={<NavigationIcon icon="settings" color="green" size="large" />}
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
