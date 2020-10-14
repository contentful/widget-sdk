import { getModule } from 'core/NgRegistry';
import checkDependencies from './checkDependencies';
import { extend } from 'lodash';
import { createEditorExtensionSDK } from 'app/widgets/ExtensionSDKs';

export const createExtensionBridgeAdapter = (scopeData) => (
  currentWidgetId,
  currentWidgetNamespace,
  parameters
) => {
  const $rootScope = getModule('$rootScope');
  const spaceContext = getModule('spaceContext');

  const data = checkDependencies('createExtensionBridgeAdapter', scopeData, [
    'editorContext',
    'editorData',
    'entityInfo',
    'fields',
    'fieldLocaleListeners',
    'localeData',
    'otDoc',
    'preferences',
    'widgets',
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
    fieldLocaleListeners: $scope.fieldLocaleListeners,
  });

  return sdk;
};
