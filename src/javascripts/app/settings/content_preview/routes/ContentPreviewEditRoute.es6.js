import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import AdminOnly from 'app/common/AdminOnly.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import ContentPreviewFormPage, {
  ContentPreviewFormPageSkeleton
} from '../ContentPreviewFormPage.es6';

const spaceContext = getModule('spaceContext');
const contentPreview = getModule('contentPreview');

const ContentTypesFetcher = createFetcherComponent(({ contentPreviewId }) => {
  return Promise.all([
    spaceContext.publishedCTs.refreshBare(),
    contentPreview.canCreate(),
    contentPreview.get(contentPreviewId)
  ]);
});

export default class ContentPreviewEditRoute extends Component {
  static propTypes = {
    contentPreviewId: PropTypes.string.isRequired,
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired
  };

  render() {
    return (
      <AdminOnly>
        <ContentTypesFetcher contentPreviewId={this.props.contentPreviewId}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <ContentPreviewFormPageSkeleton />;
            }
            if (isError) {
              return <StateRedirect to="^.list" />;
            }
            const [contentTypes, canCreate, preview] = data;
            if (!canCreate) {
              return <StateRedirect to="^.list" />;
            }
            return (
              <ContentPreviewFormPage
                isNew={false}
                initialValue={contentPreview.toInternal(preview, contentTypes)}
                registerSaveAction={this.props.registerSaveAction}
                setDirty={this.props.setDirty}
              />
            );
          }}
        </ContentTypesFetcher>
      </AdminOnly>
    );
  }
}
