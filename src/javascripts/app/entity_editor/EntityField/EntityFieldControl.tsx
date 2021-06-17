import * as React from 'react';
import { ValidationErrors } from '@contentful/field-editor-validation-errors';
import { WidgetRenderer } from 'app/entity_editor/WidgetRenderer';
import Collaborators from 'app/entity_editor/Collaborators';
import { isRtlLocale } from 'utils/locales';
import { createFieldWidgetSDK } from 'app/widgets/ExtensionSDKs';
import { getEntityLink } from 'app/common/EntityStateLink';
import { useSpaceEnvContext, useSpaceEnvContentTypes } from 'core/services/SpaceEnvContext';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';
import { LocaleData } from './types';
import { Preferences } from 'app/widgets/ExtensionSDKs/createEditorApi';
import { usePubSubClient } from 'core/hooks';
import * as K from 'core/utils/kefir';
import { connectGetEntity } from './connectedGetEntity';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';
import { isCustomWidget } from '@contentful/widget-renderer';

type EntityFieldControlProps = {
  hasInitialFocus: boolean;
  widget: any;
  locale: {
    code: any;
  };
  editorData: {
    entityInfo: {
      contentType: any;
      type: any;
    };
  };
  doc: any;
  fieldLocale: any;
  loadEvents: Function;
  localeData: LocaleData;
  preferences: Preferences;
  setInvalid: Function;
  onBlur: (...args: any[]) => any;
  onFocus: (...args: any[]) => any;
  fieldLocaleListeners: any;
};

export const EntityFieldControl = React.memo((props: EntityFieldControlProps) => {
  const {
    currentSpace,
    currentSpaceId,
    currentEnvironmentAliasId,
    currentEnvironmentId,
    currentEnvironment,
    documentPool,
  } = useSpaceEnvContext();
  const { currentSpaceContentTypes } = useSpaceEnvContentTypes();

  const { client: cma, customWidgetClient } = useCurrentSpaceAPIClient();
  const pubSubClient = usePubSubClient();
  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);

  const {
    hasInitialFocus,
    widget,
    locale,
    editorData,
    doc,
    fieldLocale,
    loadEvents,
    localeData,
    preferences,
    setInvalid,
    fieldLocaleListeners,
    onBlur,
    onFocus,
  } = props;

  const internalContentType = editorData.entityInfo.contentType;
  const isCustom = isCustomWidget(widget.widgetNamespace);

  const lifeline = K.useLifeline();
  const widgetApi = React.useMemo(() => {
    const { widgetNamespace, widgetId, fieldId, parameters } = widget;

    if (!currentSpaceId) {
      throw new Error('Space id needs to be defined');
    }

    const apiClient = isCustom ? customWidgetClient : cma;

    if (!apiClient) {
      return null;
    }

    const sdk = createFieldWidgetSDK({
      fieldId,
      localeCode: locale.code,
      editorData,
      setInvalid,
      localeData,
      preferences,
      doc,
      internalContentType,
      fieldLocaleListeners,
      widgetNamespace,
      widgetId,
      parameters,
      spaceId: currentSpaceId,
      environmentAliasId: currentEnvironmentAliasId,
      environmentId: currentEnvironmentId,
      space: currentSpace,
      environment: currentEnvironment,
      contentTypes: currentSpaceContentTypes,
      pubSubClient,
      cma: getBatchingApiClient(apiClient),
    });

    if (sdk.space) {
      Object.assign(sdk.space, connectGetEntity(sdk.space, documentPool, lifeline));
    }

    return sdk;
  }, [
    widget,
    locale.code,
    editorData,
    setInvalid,
    localeData,
    preferences,
    doc,
    internalContentType,
    fieldLocaleListeners,
    currentSpaceId,
    currentEnvironmentAliasId,
    currentEnvironmentId,
    currentSpace,
    currentEnvironment,
    currentSpaceContentTypes,
    pubSubClient,
    documentPool,
    lifeline,
    cma,
    customWidgetClient,
    isCustom,
  ]);

  if (!widgetApi) {
    return null;
  }
  return (
    <>
      <div className="entity-editor__control-group">
        <WidgetRenderer
          onFocus={onFocus}
          onBlur={onBlur}
          hasInitialFocus={hasInitialFocus}
          isRtl={isRtlLocale(locale.code)}
          loadEvents={loadEvents}
          entityType={editorData.entityInfo.type}
          locale={locale}
          widget={widget}
          widgetApi={widgetApi}
        />
        <Collaborators
          users={fieldLocale.collaborators}
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
});
