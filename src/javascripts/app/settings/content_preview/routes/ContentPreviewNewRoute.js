import React, { Component } from 'react';
import { getModule } from 'NgRegistry';
import PropTypes from 'prop-types';
import createFetcherComponent from 'app/common/createFetcherComponent';
import AdminOnly from 'app/common/AdminOnly';
import StateRedirect from 'app/common/StateRedirect';
import ContentPreviewFormPage, { ContentPreviewFormPageSkeleton } from '../ContentPreviewFormPage';
import DocumentTitle from 'components/shared/DocumentTitle';
import { contentPreviewToInternal } from 'services/contentPreview/contentPreviewToInternal';

const ContentTypesFetcher = createFetcherComponent(() => {
  const spaceContext = getModule('spaceContext');

  return spaceContext.publishedCTs.refreshBare();
});

export default class ContentPreviewNewRoute extends Component {
  static propTypes = {
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired
  };

  render() {
    return (
      <AdminOnly>
        <ContentTypesFetcher>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <ContentPreviewFormPageSkeleton />;
            }
            if (isError) {
              return <StateRedirect path="^.list" />;
            }

            const initialValue = contentPreviewToInternal(
              {
                name: '',
                description: '',
                sys: {
                  version: 0
                }
              },
              data
            );

            return (
              <React.Fragment>
                <DocumentTitle title={['New Preview', 'Content Preview']} />
                <ContentPreviewFormPage
                  isNew
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
