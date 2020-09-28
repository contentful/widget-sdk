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

  return sdk;
};
