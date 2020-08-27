import * as React from 'react';
import { ValidationErrors } from '@contentful/field-editor-validation-errors';
import { WidgetRenderer } from 'app/entity_editor/WidgetRenderer';
import Collaborators from 'app/entity_editor/Collaborators';
import { isRtlLocale } from 'utils/locales';
import { createFieldWidgetSDK } from 'app/widgets/createFieldWidgetSDK';
import { getModule } from 'core/NgRegistry';
import { getEntityLink } from 'app/common/EntityStateLink';

export function EntityFieldControl(props: { scope: any; hasInitialFocus: boolean }) {
  const widgetApi = React.useMemo(() => {
    const spaceContext = getModule('spaceContext');
    const { widget, locale } = props.scope;
    const { widgetNamespace, widgetId, fieldId, parameters } = widget;

    return createFieldWidgetSDK({
      fieldId,
      localeCode: locale.code,
      widgetNamespace,
      widgetId,
      $scope: props.scope,
      spaceContext,
      doc: props.scope.otDoc,
      internalContentType: props.scope.entityInfo.contentType,
      parameters,
    });
  }, [props.scope]);

  return (
    <>
      <div className="entity-editor__control-group">
        <WidgetRenderer
          scope={props.scope}
          widgetApi={widgetApi}
          hasInitialFocus={props.hasInitialFocus}
          isRtl={isRtlLocale(props.scope.locale.code)}
        />
        <Collaborators
          users={props.scope.fieldLocale.collaborators}
          className="entity-editor__field-collaborators"
        />
      </div>
      <ValidationErrors
        field={widgetApi.field}
        locales={widgetApi.locales}
        space={widgetApi.space}
        getEntryURL={(entry) => {
          return getEntityLink({ id: entry.sys.id, type: 'Entry' }).href;
        }}
      />
    </>
  );
}
