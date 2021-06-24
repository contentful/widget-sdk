import React from 'react';
import { values } from 'lodash';

import * as AccessChecker from 'access_control/AccessChecker';
import createFetcherComponent from 'app/common/createFetcherComponent';
import { ReactRouterRedirect } from 'core/react-routing';
import DocumentTitle from 'components/shared/DocumentTitle';

import { ContentPreviewListPage } from '../ContentPreviewListPage';
import { ContentPreviewListSkeleton } from '../skeletons/ContentPreviewListSkeleton';
import { getContentPreview } from '../services/getContentPreview';

const ContentPreviewsFetcher = createFetcherComponent(() => {
  return getContentPreview()
    .getAll()
    .then((previews) => values(previews));
});

export function ContentPreviewListRoute() {
  const isForbidden = !AccessChecker.getSectionVisibility().settings;
  if (isForbidden) {
    return <ReactRouterRedirect route={{ path: 'entries.list' }} />;
  }
  return (
    <ContentPreviewsFetcher>
      {({ isLoading, isError, data }) => {
        if (isLoading) {
          return <ContentPreviewListSkeleton />;
        }
        if (isError) {
          return <ReactRouterRedirect route={{ path: 'entries.list' }} />;
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
