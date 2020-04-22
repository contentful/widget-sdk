import React from 'react';
import { get } from 'lodash';
import { canCreateEntry } from 'access_control/AccessChecker';
import { getEntityLink } from 'app/common/EntityStateLink';
import {
  SingleEntryReferenceEditor,
  MultipleEntryReferenceEditor,
} from '@contentful/field-editor-reference';
import { safeNonBlockingTrack, EditorWithTrackingProps } from './utils';

export function getCtId(entry) {
  return get(entry, 'sys.contentType.sys.id');
}

const onEntryAction = (loadEvents, sdk) => (action) => {
  switch (action.type) {
    case 'select_and_link':
      safeNonBlockingTrack('reference_editor_action:link', {
        ctId: getCtId(action.entityData),
      });
      break;
    case 'create_and_link':
      safeNonBlockingTrack('reference_editor_action:create', {
        ctId: getCtId(action.entityData),
      });
      safeNonBlockingTrack('entry:create', {
        eventOrigin: 'reference-editor',
        contentType: sdk.contentType,
        response: action.entityData,
      });
      if (action.slide) {
        safeNonBlockingTrack('slide_in_editor:open_create', action.slide);
      }
      break;
    case 'delete':
      safeNonBlockingTrack('reference_editor_action:delete', {
        ctId: action.contentTypeId,
      });
      break;
    case 'edit':
      safeNonBlockingTrack('reference_editor_action:edit', { ctId: action.contentTypeId });
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

export function SingleEntryReferenceEditorWithTracking(props) {
  const { loadEvents, viewType, sdk } = props;

  const onAction = onEntryAction(loadEvents, sdk);

  return (
    <SingleEntryReferenceEditor
      viewType={viewType}
      sdk={sdk}
      getEntityUrl={(entryId) => getEntityLink({ id: entryId, type: 'Entry' }).href}
      parameters={{
        instance: {
          canCreateEntity: canCreateEntry(),
          canLinkEntity: true,
        },
      }}
      onAction={onAction}
    />
  );
}

export function MultipleEntryReferenceEditorWithTracking(props) {
  const { loadEvents, viewType, sdk } = props;

  const onAction = onEntryAction(loadEvents, sdk);

  return (
    <MultipleEntryReferenceEditor
      viewType={viewType}
      sdk={sdk}
      getEntityUrl={(entryId) => getEntityLink({ id: entryId, type: 'Entry' }).href}
      parameters={{
        instance: {
          canCreateEntity: canCreateEntry(),
          canLinkEntity: true,
          bulkEditing: get(sdk, 'parameters.instance.bulkEditing', false),
        },
      }}
      onAction={onAction}
    />
  );
}

SingleEntryReferenceEditorWithTracking.propTypes = EditorWithTrackingProps;
MultipleEntryReferenceEditorWithTracking.propTypes = EditorWithTrackingProps;
