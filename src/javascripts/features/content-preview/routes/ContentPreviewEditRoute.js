import React from 'react';
import PropTypes from 'prop-types';
import createFetcherComponent from 'app/common/createFetcherComponent';
import { AdminOnly } from './AdminOnly';
import StateRedirect from 'app/common/StateRedirect';
import DocumentTitle from 'components/shared/DocumentTitle';
import { ContentPreviewFormSkeleton } from '../skeletons/ContentPreviewFormSkeleton';
import { ContentPreviewFormPage } from '../ContentPreviewFormPage';
import { getContentPreview } from '../services/getContentPreview';
import { contentPreviewToInternal } from '../services/contentPreviewToInternal';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

const ContentTypesFetcher = createFetcherComponent(({ contentPreviewId }) => {
  return getContentPreview().get(contentPreviewId);
});

export function ContentPreviewEditRoute(props) {
  const { currentSpaceContentTypes } = useSpaceEnvContext();

  return (
    <AdminOnly>
      <ContentTypesFetcher contentPreviewId={props.contentPreviewId}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <ContentPreviewFormSkeleton />;
          }
          if (isError) {
            return <StateRedirect path="^.list" />;
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

ContentPreviewEditRoute.propTypes = {
  contentPreviewId: PropTypes.string.isRequired,
  registerSaveAction: PropTypes.func.isRequired,
  setDirty: PropTypes.func.isRequired,
};
