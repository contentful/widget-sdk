import { Note } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { WidgetLocation, WidgetNamespace, WidgetRenderer } from '@contentful/widget-renderer';
import { createEditorExtensionSDK } from 'app/widgets/ExtensionSDKs';
import { EditorExtensionSDK } from '@contentful/app-sdk';
import { usePubSubClient } from 'core/hooks';
import { useSpaceEnvContext, useContentTypes } from 'core/services/SpaceEnvContext';
import { css } from 'emotion';
import React from 'react';
import { LegacyWidget, toRendererWidget } from 'widgets/WidgetCompat';

const styles = {
  installationNote: css({
    margin: tokens.spacingM,
  }),
};

interface Props {
  scope: {
    editorData: any;
    entityInfo: any;
    otDoc: any;
    localeData: any;
    preferences: any;
    fields: any;
    widgets: any;
    fieldLocaleListeners: any;
  };
  extension: {
    widgetId: string;
    diasbled: boolean;
    widgetNamespace: WidgetNamespace;
    problem: string;
    descriptor: LegacyWidget;
    parameters: {
      instance: Record<string, any>;
      installation: Record<string, any>;
    };
  };
}

const CustomEditorExtensionRenderer = (props: Props) => {
  const { extension, scope } = props;
  const { descriptor, parameters } = extension;

  const {
    currentEnvironment,
    currentEnvironmentId,
    currentSpace,
    currentSpaceId,
  } = useSpaceEnvContext();
  const { currentSpaceContentTypes } = useContentTypes();

  const pubSubClient = usePubSubClient();

  if (!currentEnvironmentId || !currentSpaceId) return null;

  if (extension.problem) {
    return (
      <Note noteType="warning" className={styles.installationNote}>
        <code>{extension.widgetId}</code> is saved in configuration, but not installed in this
        environment.
      </Note>
    );
  }

  const widget = toRendererWidget(descriptor);
  const sdk: EditorExtensionSDK = createEditorExtensionSDK({
    editorData: scope.editorData,
    localeData: scope.localeData,
    preferences: scope.preferences,
    internalContentType: scope.entityInfo.contentType,
    widgetNamespace: extension.widgetNamespace,
    widgetId: extension.widgetId,
    parameters,
    doc: scope.otDoc,
    fieldLocaleListeners: scope.fieldLocaleListeners,
    contentTypes: currentSpaceContentTypes,
    environment: currentEnvironment,
    environmentId: currentEnvironmentId,
    space: currentSpace,
    spaceId: currentSpaceId,
    pubSubClient,
  });

  return (
    <WidgetRenderer sdk={sdk} location={WidgetLocation.ENTRY_EDITOR} widget={widget} isFullSize />
  );
};

export default CustomEditorExtensionRenderer;
