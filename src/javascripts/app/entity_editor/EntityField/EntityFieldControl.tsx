import * as React from 'react';
import { ValidationErrors } from '@contentful/field-editor-validation-errors';
import { WidgetRenderer } from 'app/entity_editor/WidgetRenderer';
import Collaborators from 'app/entity_editor/Collaborators';
import { isRtlLocale } from 'utils/locales';
import { createFieldWidgetSDK } from 'app/widgets/ExtensionSDKs';
import { getModule } from 'core/NgRegistry';
import { getEntityLink } from 'app/common/EntityStateLink';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';

export function EntityFieldControl(props: { scope: any; hasInitialFocus: boolean }) {
  const { currentSpace } = useSpaceEnvContext();
  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);

  const widgetApi = React.useMemo(() => {
    const spaceContext = getModule('spaceContext');
    const {
      widget,
      locale,
      editorData,
      fieldController,
      localeData,
      preferences,
      otDoc: doc,
    } = props.scope;
    const { widgetNamespace, widgetId, fieldId, parameters } = widget;

    return createFieldWidgetSDK({
      fieldId,
      localeCode: locale.code,
      widgetNamespace,
      widgetId,
      editorData,
      fieldController,
      localeData,
      preferences,
      spaceContext,
      doc,
      watch: (watchFn, cb) => props.scope.$watch(watchFn, cb),

      internalContentType: props.scope.entityInfo.contentType,
      fieldLocaleListeners: props.scope.fieldLocaleListeners,
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
          return getEntityLink({ id: entry.sys.id, type: 'Entry', isMasterEnvironment }).href;
        }}
      />
    </>
  );
}
