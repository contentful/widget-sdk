import React from 'react';
import PropTypes from 'prop-types';
import { AdminOnly } from './AdminOnly';
import DocumentTitle from 'components/shared/DocumentTitle';

import { ContentPreviewFormPage } from '../ContentPreviewFormPage';
import { contentPreviewToInternal } from '../services/contentPreviewToInternal';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

export function ContentPreviewNewRoute(props) {
  const { currentSpaceContentTypes } = useSpaceEnvContext();

  const initialValue = contentPreviewToInternal(
    {
      name: '',
      description: '',
      sys: {
        version: 0,
      },
    },
    currentSpaceContentTypes
  );

  return (
    <AdminOnly>
      <DocumentTitle title={['New Preview', 'Content Preview']} />
      <ContentPreviewFormPage
        isNew
        initialValue={initialValue}
        registerSaveAction={props.registerSaveAction}
        setDirty={props.setDirty}
      />
    </AdminOnly>
  );
}

ContentPreviewNewRoute.propTypes = {
  registerSaveAction: PropTypes.func.isRequired,
  setDirty: PropTypes.func.isRequired,
};
