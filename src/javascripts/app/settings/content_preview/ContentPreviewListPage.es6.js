import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Note } from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import { WhatIsContentPreview } from './ContentPreviewSidebar.es6';
import CreatePreviewButton from './CreatePreviewButton.es6';
import ContentPreviewList from './ContentPreviewList.es6';
import { CONTENT_PREVIEW_LIMIT } from 'services/contentPreview.es6';

const CreatePreviewSection = ({ canCreate }) => {
  return (
    <div style={{ marginBottom: 20 }}>
      {canCreate && <CreatePreviewButton />}
      {!canCreate && (
        <Note>You can‘t create more than {CONTENT_PREVIEW_LIMIT} preview environments</Note>
      )}
    </div>
  );
};
CreatePreviewSection.propTypes = {
  canCreate: PropTypes.bool.isRequired
};

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
        <Workbench.Header>
          <Workbench.Icon icon="page-settings" />
          <Workbench.Title>Content preview</Workbench.Title>
        </Workbench.Header>
        <Workbench.Content>
          <ContentPreviewList contentPreviews={contentPreviews} />
        </Workbench.Content>
        <Workbench.Sidebar className="content-preview-sidebar">
          {contentPreviews.length > 0 && (
            <CreatePreviewSection canCreate={contentPreviews.length < CONTENT_PREVIEW_LIMIT} />
          )}
          <WhatIsContentPreview />
        </Workbench.Sidebar>
      </Workbench>
    );
  }
}
