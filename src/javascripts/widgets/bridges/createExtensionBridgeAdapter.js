import { getModule } from 'core/NgRegistry';
import createExtensionBridge from './createExtensionBridge';
import * as Navigator from 'states/Navigator';
import * as SlideInNavigator from 'navigation/SlideInNavigator';
import { WidgetLocation } from '@contentful/widget-renderer';
import checkDependencies from './checkDependencies';
import { extend } from 'lodash';

export const createExtensionBridgeAdapter = (scopeData) => (
  currentWidgetId,
  currentWidgetNamespace
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
  ]);

  const $scope = extend($rootScope.$new(), data);

  return createExtensionBridge({
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
};

export const useCreateExtensionBridgeAdapter = () => {};
