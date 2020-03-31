import React from 'react';
import get from 'lodash/get';
import noop from 'lodash/noop';
import PropTypes from 'prop-types';
import { track } from 'analytics/Analytics';
import { AssetReferenceEditor, EntryReferenceEditor } from '@contentful/field-editor-reference';

export { AssetReferenceEditor };

function getCtId(entry) {
  return get(entry, 'sys.contentType.sys.id');
}

const safeNonBlockingTrack = (...args) => {
  const queueFn = window.requestIdleCallback || window.requestAnimationFrame || noop;
  queueFn(() => {
    try {
      track(...args);
    } catch (e) {
      // do nothing
    }
  });
};

export function AssetReferenceEditorWithTracking(props) {
  const { loadEvents, ...rest } = props;
  return (
    <AssetReferenceEditor
      {...rest}
      onAction={(action) => {
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
            loadEvents.emit({ actionName: 'linksRendered' });
            break;
          default:
            break;
        }
      }}
    />
  );
}

export function EntryReferenceEditorWithTracking(props) {
  const { loadEvents, ...rest } = props;

  return (
    <EntryReferenceEditor
      {...rest}
      onAction={(action) => {
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
              contentType: props.sdk.contentType,
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
            loadEvents.emit({ actionName: 'linksRendered' });
            break;
          default:
            break;
        }
      }}
    />
  );
}

const EditorWithTrackingProps = {
  sdk: PropTypes.object.isRequired,
  loadEvents: PropTypes.shape({
    emit: PropTypes.func.isRequired,
  }).isRequired,
};

AssetReferenceEditorWithTracking.propTypes = EditorWithTrackingProps;
EntryReferenceEditorWithTracking.propTypes = EditorWithTrackingProps;
