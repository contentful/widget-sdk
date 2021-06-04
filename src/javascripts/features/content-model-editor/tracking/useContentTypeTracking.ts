import keyBy from 'lodash/keyBy';

import { ContentType, EditorInterface, EditorInterfaceControl } from 'core/typings';
import { tracking } from 'analytics/Analytics';

type ContentTypeTrackingParams = {
  currentOrganizationId?: string;
  currentSpaceId?: string;
  currentResolvedEnvironmentId: string;
};

export function useContentTypeTracking(params: ContentTypeTrackingParams) {
  const { currentOrganizationId, currentSpaceId, currentResolvedEnvironmentId } = params;
  const isBuiltinWidget = ({ widgetNamespace }: EditorInterfaceControl) =>
    widgetNamespace === 'builtin';
  const isSlugWidget = ({ widgetId }: EditorInterfaceControl) => widgetId === 'slugEditor';

  const fieldsUpdated = (contentType: ContentType, editorInterface: EditorInterface) => {
    const contentTypeFields = keyBy(contentType.fields, ({ apiName, id }) => apiName || id);
    const { controls = [] } = editorInterface;

    controls
      .filter(isBuiltinWidget)
      .filter(isSlugWidget)
      .forEach((control) => {
        const field = contentTypeFields[control.fieldId] ?? {};

        tracking.editorInterfaceFieldUpdated({
          organization_key: currentOrganizationId,
          space_key: currentSpaceId,
          environment_key: currentResolvedEnvironmentId,
          content_type_id: contentType.sys.id,
          field_id: control.fieldId,
          field_type: field.type,
          widget_id: control.widgetId,
          field_settings: control.settings ?? {},
        });
      });
  };

  return { fieldsUpdated };
}
