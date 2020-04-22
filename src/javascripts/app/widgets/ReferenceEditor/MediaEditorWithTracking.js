import React from 'react';
import { getEntityLink } from 'app/common/EntityStateLink';
import { canCreateAsset } from 'access_control/AccessChecker';
import { SingleMediaEditor, MultipleMediaEditor } from '@contentful/field-editor-reference';
import { safeNonBlockingTrack, EditorWithTrackingProps } from './utils';

const onMediaAction = (loadEvents, sdk) => (action) => {
  switch (action.type) {
    case 'select_and_link':
      safeNonBlockingTrack('reference_editor_action:link');
      break;
    case 'create_and_link':
      safeNonBlockingTrack('reference_editor_action:create');
      if (action.slide) {
        safeNonBlockingTrack('slide_in_editor:open_create', action.slide);
      }
      break;
    case 'delete':
      safeNonBlockingTrack('reference_editor_action:delete');
      break;
    case 'edit':
      safeNonBlockingTrack('reference_editor_action:edit');
      if (action.slide) {
        safeNonBlockingTrack('slide_in_editor:open', action.slide);
      }
      break;
    case 'rendered':
      loadEvents.emit({
        actionName: 'linksRendered',
        field: {
          id: sdk.field.id,
          locale: sdk.field.locale,
        },
      });
      break;
    default:
      break;
  }
};

export function SingleMediaEditorWithTracking(props) {
  const { loadEvents, viewType, sdk } = props;
  const onAction = onMediaAction(loadEvents, sdk);
  return (
    <SingleMediaEditor
      viewType={viewType}
      sdk={sdk}
      getEntityUrl={(assetId) => getEntityLink({ id: assetId, type: 'Asset' }).href}
      parameters={{
        instance: {
          canCreateEntity: canCreateAsset(),
          canLinkEntity: true,
        },
      }}
      onAction={onAction}
    />
  );
}

export function MultipleMediaEditorWithTracking(props) {
  const { loadEvents, viewType, sdk } = props;
  const onAction = onMediaAction(loadEvents, sdk);
  return (
    <MultipleMediaEditor
      viewType={viewType}
      sdk={sdk}
      getEntityUrl={(assetId) => getEntityLink({ id: assetId, type: 'Asset' }).href}
      parameters={{
        instance: {
          canCreateEntity: canCreateAsset(),
          canLinkEntity: true,
        },
      }}
      onAction={onAction}
    />
  );
}

SingleMediaEditorWithTracking.propTypes = EditorWithTrackingProps;
MultipleMediaEditorWithTracking.propTypes = EditorWithTrackingProps;
