import { Note } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { WidgetLocation, WidgetNamespace, WidgetRenderer } from '@contentful/widget-renderer';
import { createEditorExtensionSDK } from 'app/widgets/ExtensionSDKs';
import { EditorExtensionSDK } from 'contentful-ui-extensions-sdk';
import { getModule } from 'core/NgRegistry';
import { css } from 'emotion';
import { extend } from 'lodash';
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
  const spaceContext = getModule('spaceContext');
  const $rootScope = getModule('$rootScope');
  const $scope = extend($rootScope.$new(), scope);
  const { descriptor, parameters } = extension;

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
    $scope,
    spaceContext,
    internalContentType: $scope.entityInfo.contentType,
    widgetNamespace: extension.widgetNamespace,
    widgetId: extension.widgetId,
    parameters,
    doc: $scope.otDoc,
    fieldLocaleListeners: $scope.fieldLocaleListeners,
  });

  return (
    <WidgetRenderer sdk={sdk} location={WidgetLocation.ENTRY_EDITOR} widget={widget} isFullSize />
  );
};

export default CustomEditorExtensionRenderer;
