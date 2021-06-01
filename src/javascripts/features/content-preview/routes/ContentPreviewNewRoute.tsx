import React from 'react';
import { AdminOnly } from './AdminOnly';
import DocumentTitle from 'components/shared/DocumentTitle';

import { ContentPreviewFormPage } from '../ContentPreviewFormPage';
import { contentPreviewToInternal } from '../services/contentPreviewToInternal';
import { useSpaceEnvContentTypes } from 'core/services/SpaceEnvContext';
import type { UnsavedChangesModalProps } from 'core/hooks';

export function ContentPreviewNewRoute(props: UnsavedChangesModalProps) {
  const { currentSpaceContentTypes } = useSpaceEnvContentTypes();

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
