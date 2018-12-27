import React, { Component } from 'react';
import { values } from 'lodash';
import * as AccessChecker from 'access_control/AccessChecker/index.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import ContentPreviewListPage from '../ContentPreviewListPage.es6';
import { getModule } from 'NgRegistry.es6';

const contentPreview = getModule('contentPreview');

const ContentPreviewsFetcher = createFetcherComponent(() => {
  return contentPreview.getAll().then(previews => values(previews));
});

export default class ContentPreviewListRoute extends Component {
  render() {
    const isForbidden = !AccessChecker.getSectionVisibility().settings;
    if (isForbidden) {
      return <StateRedirect to="spaces.detail.entries.list" />;
    }
    return (
      <ContentPreviewsFetcher>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <FetcherLoading message="Loading content preview.." />;
          }
          if (isError) {
            return <StateRedirect to="spaces.detail.entries.list" />;
          }
          return (
            <ContentPreviewListPage
              contentPreviews={data}
              maxContentPreviews={contentPreview.MAX_PREVIEW_ENVIRONMENTS}
            />
          );
        }}
      </ContentPreviewsFetcher>
    );
  }
}
