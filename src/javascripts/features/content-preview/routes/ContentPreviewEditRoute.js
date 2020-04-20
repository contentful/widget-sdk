import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'core/NgRegistry';
import createFetcherComponent from 'app/common/createFetcherComponent';
import AdminOnly from 'app/common/AdminOnly';
import StateRedirect from 'app/common/StateRedirect';
import DocumentTitle from 'components/shared/DocumentTitle';
import { ContentPreviewFormSkeleton } from '../skeletons/ContentPreviewFormSkeleton';
import { ContentPreviewFormPage } from '../ContentPreviewFormPage';
import { getContentPreview } from '../services/getContentPreview';
import { contentPreviewToInternal } from '../services/contentPreviewToInternal';

const ContentTypesFetcher = createFetcherComponent(({ contentPreviewId }) => {
  const spaceContext = getModule('spaceContext');

  return Promise.all([
    spaceContext.publishedCTs.refreshBare(),
    getContentPreview().get(contentPreviewId),
  ]);
});

export class ContentPreviewEditRoute extends Component {
  static propTypes = {
    contentPreviewId: PropTypes.string.isRequired,
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired,
  };

  render() {
    return (
      <AdminOnly>
        <ContentTypesFetcher contentPreviewId={this.props.contentPreviewId}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <ContentPreviewFormSkeleton />;
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
