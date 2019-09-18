import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import AdminOnly from 'app/common/AdminOnly.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import ContentPreviewFormPage, {
  ContentPreviewFormPageSkeleton
} from '../ContentPreviewFormPage.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';

const ContentTypesFetcher = createFetcherComponent(({ contentPreviewId }) => {
  const spaceContext = getModule('spaceContext');

  return Promise.all([
    spaceContext.publishedCTs.refreshBare(),
    spaceContext.contentPreview.get(contentPreviewId)
  ]);
});

export default class ContentPreviewEditRoute extends Component {
  static propTypes = {
    contentPreviewId: PropTypes.string.isRequired,
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired
  };

  render() {
    const spaceContext = getModule('spaceContext');

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
            const [contentTypes, preview] = data;
            const initialValue = spaceContext.contentPreview.toInternal(preview, contentTypes);
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
