import React from 'react';
import { get } from 'lodash';
import { getEntityLink } from 'app/common/EntityStateLink';
import { SingleMediaEditor, MultipleMediaEditor } from '@contentful/field-editor-reference';
import { trackReferenceAction, safeNonBlockingTrack } from './utils';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';
import { StreamBus } from 'core/utils/kefir';
import { WidgetApi } from 'widgets/BuiltinWidgets';
import { EditorWithTrackingProps } from './types';

const onMediaAction = (loadEvents: StreamBus<any>, sdk: WidgetApi) => (action) => {
  switch (action.type) {
    case 'select_and_link':
      trackReferenceAction('reference_editor_action:link', action, sdk);
      break;
    case 'create_and_link':
      trackReferenceAction('reference_editor_action:create', action, sdk);
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

export function SingleMediaEditorWithTracking(props: EditorWithTrackingProps) {
  const { currentSpace } = useSpaceEnvContext();
  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);
  const { loadEvents, viewType, sdk, renderCustomActions } = props;
  const onAction = onMediaAction(loadEvents, sdk);
  return (
    <SingleMediaEditor
      isInitiallyDisabled={false}
      viewType={viewType}
      sdk={sdk}
      getEntityUrl={(assetId) =>
        getEntityLink({ id: assetId, type: 'Asset', isMasterEnvironment }).href
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

export function MultipleMediaEditorWithTracking(props: EditorWithTrackingProps) {
  const { currentSpace } = useSpaceEnvContext();
  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);
  const { loadEvents, viewType, sdk, renderCustomActions } = props;
  const onAction = onMediaAction(loadEvents, sdk);
  return (
    <MultipleMediaEditor
      isInitiallyDisabled={false}
      viewType={viewType}
      sdk={sdk}
      getEntityUrl={(assetId) =>
        getEntityLink({ id: assetId, type: 'Asset', isMasterEnvironment }).href
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
