import React, { Component } from 'react';
import { values } from 'lodash';

import * as AccessChecker from 'access_control/AccessChecker/index.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import ContentPreviewListPage, {
  ContentPreviewListPageSkeleton
} from '../ContentPreviewListPage.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import { getContentPreview } from 'services/contentPreview';

const ContentPreviewsFetcher = createFetcherComponent(() => {
  return getContentPreview()
    .getAll()
    .then(previews => values(previews));
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
            return <ContentPreviewListPageSkeleton />;
          }
          if (isError) {
            return <StateRedirect to="spaces.detail.entries.list" />;
          }
          return (
            <React.Fragment>
              <DocumentTitle title="Content Preview" />
              <ContentPreviewListPage contentPreviews={data} />
            </React.Fragment>
          );
        }}
      </ContentPreviewsFetcher>
    );
  }
}
