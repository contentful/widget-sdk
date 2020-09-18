import { getModule } from 'core/NgRegistry';
import createExtensionBridge from './createExtensionBridge';
import * as Navigator from 'states/Navigator';
import * as SlideInNavigator from 'navigation/SlideInNavigator';
import { WidgetLocation } from '@contentful/widget-renderer';
import checkDependencies from './checkDependencies';
import { extend } from 'lodash';
import { createEditorExtensionSDK } from 'app/widgets/ExtensionSDKs';

export const createExtensionBridgeAdapter = (scopeData) => (
  currentWidgetId,
  currentWidgetNamespace,
  parameters
) => {
  const $rootScope = getModule('$rootScope');
  const $controller = getModule('$controller');
  const spaceContext = getModule('spaceContext');

  const data = checkDependencies('createExtensionBridgeAdapter', scopeData, [
    'editorData',
    'entityInfo',
    'otDoc',
    'localeData',
    'preferences',
    'fields',
    'widgets',
    'fieldLocaleListeners',
  ]);

  const $scope = extend($rootScope.$new(), data);

  const sdk = createEditorExtensionSDK({
    $scope,
    spaceContext,
    internalContentType: $scope.entityInfo.contentType,
    widgetNamespace: currentWidgetNamespace,
    widgetId: currentWidgetId,
    parameters,
    doc: $scope.otDoc,
  });

  // TODO: get rid of the whole "createExtensionBridge" once new renderer
  // is used everywhere and feature flags are gone.
  const bridge = createExtensionBridge({
    $rootScope,
    $controller,
    $scope,
    spaceContext,
    Navigator,
    SlideInNavigator,
    currentWidgetId,
    currentWidgetNamespace,
    location: WidgetLocation.ENTRY_EDITOR,
  });

  return { sdk, bridge, useNewWidgetRenderer: $scope.editorData.useNewWidgetRenderer.editor };
};
