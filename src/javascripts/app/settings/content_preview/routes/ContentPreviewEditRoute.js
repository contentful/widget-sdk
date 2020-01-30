import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry';
import createFetcherComponent from 'app/common/createFetcherComponent';
import AdminOnly from 'app/common/AdminOnly';
import StateRedirect from 'app/common/StateRedirect';
import ContentPreviewFormPage, { ContentPreviewFormPageSkeleton } from '../ContentPreviewFormPage';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getContentPreview } from 'services/contentPreview';
import { contentPreviewToInternal } from 'services/contentPreview/contentPreviewToInternal';

const ContentTypesFetcher = createFetcherComponent(({ contentPreviewId }) => {
  const spaceContext = getModule('spaceContext');

  return Promise.all([
    spaceContext.publishedCTs.refreshBare(),
    getContentPreview().get(contentPreviewId)
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
              return <StateRedirect path="^.list" />;
            }
            const [contentTypes, preview] = data;
            const initialValue = contentPreviewToInternal(preview, contentTypes);
            return (
              <React.Fragment>
                <DocumentTitle title={[initialValue.name, 'Content Preview']} />
                <ContentPreviewFormPage
                  isNew={false}
                  initialValue={initialValue}
                  registerSaveAction={this.props.registerSaveAction}
                  setDirty={this.props.setDirty}
                />
              </React.Fragment>
            );
          }}
        </ContentTypesFetcher>
      </AdminOnly>
    );
  }
}
