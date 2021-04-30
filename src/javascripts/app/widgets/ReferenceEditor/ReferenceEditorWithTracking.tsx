import React from 'react';
import { get } from 'lodash';
import { getEntityLink } from 'app/common/EntityStateLink';
import {
  SingleEntryReferenceEditor,
  MultipleEntryReferenceEditor,
} from '@contentful/field-editor-reference';
import { trackReferenceAction, safeNonBlockingTrack } from './utils';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';
import { StreamBus } from 'core/utils/kefir';
import { WidgetApi } from 'widgets/BuiltinWidgets';
import { EditorWithTrackingProps } from './types';

export function getCtId(entry) {
  return get(entry, 'sys.contentType.sys.id');
}

const onEntryAction = (loadEvents: StreamBus<any>, sdk: WidgetApi) => {
  return (action) => {
    switch (action.type) {
      case 'select_and_link':
        trackReferenceAction('reference_editor_action:link', action, sdk);
        break;
      case 'create_and_link':
        trackReferenceAction('reference_editor_action:create', action, sdk);
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
        trackReferenceAction('reference_editor_action:delete', action, sdk);
        break;
      case 'edit':
        trackReferenceAction('reference_editor_action:edit', action, sdk);
        if (action.slide) {
          safeNonBlockingTrack('slide_in_editor:open', action.slide);
        }
        break;
      case 'rendered':
        loadEvents.emit({
          actionName: 'linkRendered',
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
};

export function SingleEntryReferenceEditorWithTracking(props: EditorWithTrackingProps) {
  const { currentSpace } = useSpaceEnvContext();
  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);
  const { loadEvents, viewType, sdk, renderCustomActions } = props;

  const onAction = onEntryAction(loadEvents, sdk);

  return (
    <SingleEntryReferenceEditor
      viewType={viewType}
      hasCardEditActions={false}
      isInitiallyDisabled={false}
      sdk={sdk}
      getEntityUrl={(entryId) =>
        getEntityLink({ id: entryId, type: 'Entry', isMasterEnvironment }).href
      }
      parameters={{
        instance: {
          showCreateEntityAction: get(sdk, 'parameters.instance.showCreateEntityAction', true),
          showLinkEntityAction: get(sdk, 'parameters.instance.showLinkEntityAction', true),
        },
      }}
      onAction={onAction}
      renderCustomActions={renderCustomActions}
    />
  );
}

export function MultipleEntryReferenceEditorWithTracking(props: EditorWithTrackingProps) {
  const { currentSpace } = useSpaceEnvContext();
  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);
  const { loadEvents, viewType, sdk, renderCustomActions } = props;

  const onAction = React.useMemo(() => onEntryAction(loadEvents, sdk), [loadEvents, sdk]);

  return (
    <MultipleEntryReferenceEditor
      viewType={viewType}
      sdk={sdk}
      getEntityUrl={(entryId) =>
        getEntityLink({ id: entryId, type: 'Entry', isMasterEnvironment }).href
      }
      parameters={{
        instance: {
          showCreateEntityAction: get(sdk, 'parameters.instance.showCreateEntityAction', true),
          showLinkEntityAction: get(sdk, 'parameters.instance.showLinkEntityAction', true),
          bulkEditing: get(sdk, 'parameters.instance.bulkEditing', false),
        },
      }}
      onAction={onAction}
      renderCustomActions={renderCustomActions}
      hasCardEditActions={false}
      isInitiallyDisabled={false}
    />
  );
}
