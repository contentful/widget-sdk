import React from 'react';
import createFetcherComponent from 'app/common/createFetcherComponent';
import { AdminOnly } from './AdminOnly';
import DocumentTitle from 'components/shared/DocumentTitle';
import { ContentPreviewFormSkeleton } from '../skeletons/ContentPreviewFormSkeleton';
import { ContentPreviewFormPage } from '../ContentPreviewFormPage';
import { getContentPreview } from '../services/getContentPreview';
import { contentPreviewToInternal } from '../services/contentPreviewToInternal';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import type { UnsavedChangesModalProps } from 'core/hooks';
import { RouteNavigate, useParams } from 'core/react-routing';

const ContentTypesFetcher = createFetcherComponent(({ contentPreviewId }) => {
  return getContentPreview().get(contentPreviewId);
});

export function ContentPreviewEditRoute(props: UnsavedChangesModalProps) {
  const { contentPreviewId } = useParams();
  const { currentSpaceContentTypes } = useSpaceEnvContext();

  return (
    <AdminOnly>
      <ContentTypesFetcher contentPreviewId={contentPreviewId}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <ContentPreviewFormSkeleton />;
          }
          if (isError || !data) {
            return <RouteNavigate route={{ path: 'content_preview.list' }} />;
          }
          const initialValue = contentPreviewToInternal(data, currentSpaceContentTypes);
          return (
            <React.Fragment>
              <DocumentTitle title={[initialValue.name, 'Content Preview']} />
              <ContentPreviewFormPage
                isNew={false}
                initialValue={initialValue}
                registerSaveAction={props.registerSaveAction}
                setDirty={props.setDirty}
              />
            </React.Fragment>
          );
        }}
      </ContentTypesFetcher>
    </AdminOnly>
  );
}
