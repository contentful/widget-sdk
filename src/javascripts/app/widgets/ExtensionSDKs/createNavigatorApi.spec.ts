import { createNavigatorApi, createReadOnlyNavigatorApi } from './createNavigatorApi';
import { onSlideInNavigation } from 'navigation/SlideInNavigator/index';
import { WidgetNamespace } from '@contentful/widget-renderer';
import * as Navigator from 'states/Navigator';
import {
  makeExtensionNavigationHandlers,
  makeExtensionBulkNavigationHandlers,
} from 'widgets/bridges/makeExtensionNavigationHandlers';
import { makeReadOnlyApiError, ReadOnlyApi } from './createReadOnlyApi';

jest.mock('navigation/SlideInNavigator/index');
jest.mock('states/Navigator');
jest.mock('widgets/bridges/makeExtensionNavigationHandlers');

describe('createNavigatorApi', () => {
  let navigatorApi;
  describe('when creating read-only API', () => {
    let allNonHandlerMethods, allMethods, allHandlerMethods;
    beforeEach(() => {
      navigatorApi = createReadOnlyNavigatorApi();
      allMethods = Object.getOwnPropertyNames(navigatorApi).filter(
        (prop) => typeof navigatorApi[prop] === 'function'
      );
      allNonHandlerMethods = allMethods.filter((method) => !method.startsWith('on'));
      allHandlerMethods = allMethods.filter((method) => method.startsWith('on'));
    });

    it(`throws a ReadOnlyNavigatorAPI error on every non-handler method`, () => {
      for (const method of allNonHandlerMethods) {
        expect(() => navigatorApi[method]()).toThrowError(
          makeReadOnlyApiError(ReadOnlyApi.Navigate)
        );
      }
    });

    it(`does not throw on every handler method`, () => {
      for (const method of allHandlerMethods) {
        expect(() => navigatorApi[method]()).not.toThrowError(
          makeReadOnlyApiError(ReadOnlyApi.Navigate)
        );
      }
    });
  });

  describe('when creating non-read-only API', () => {
    const DEFAULT_WIDGET_NAMESPACE = WidgetNamespace.APP;
    const DEFAULT_WIDGET_ID = 'my_widget';
    const DEFAULT_ENVIRONMENT_ID = 'envid';
    const DEFAULT_SPACE_ID = 'spaceid';
    const spaceContext = {
      getId: () => DEFAULT_SPACE_ID,
      getEnvironmentId: () => DEFAULT_ENVIRONMENT_ID,
      isMasterEnvironment: () => true,
    };
    const buildApi = ({
      widgetNamespace = DEFAULT_WIDGET_NAMESPACE,
      isOnPageLocation = false,
    } = {}) =>
      createNavigatorApi({
        spaceContext,
        widgetNamespace,
        widgetId: DEFAULT_WIDGET_ID,
        isOnPageLocation,
      });

    describe('openEntry', () => {
      it('calls navigateToContentEntity with the correct arguments', () => {
        const navigateToContentEntity = jest.fn();
        (makeExtensionNavigationHandlers as jest.Mock).mockReturnValueOnce(navigateToContentEntity);

        const navigatorApi = buildApi();
        navigatorApi.openEntry('my_id', { slideIn: true });
        expect(navigateToContentEntity).toHaveBeenCalledWith({
          entityType: 'Entry',
          slideIn: true,
          id: 'my_id',
        });
      });
    });

    describe('openNewEntry', () => {
      it('calls navigateToContentEntity with correct arguments', () => {
        const navigateToContentEntity = jest.fn();
        (makeExtensionNavigationHandlers as jest.Mock).mockReturnValueOnce(navigateToContentEntity);

        const navigatorApi = buildApi();
        navigatorApi.openNewEntry('content_type_id', { slideIn: true });
        expect(navigateToContentEntity).toHaveBeenCalledWith({
          entityType: 'Entry',
          slideIn: true,
          id: null,
          contentTypeId: 'content_type_id',
        });
      });
    });

    describe('openAsset', () => {
      it('calls navigateToContentEntity with the correct arguments', () => {
        const navigateToContentEntity = jest.fn();
        (makeExtensionNavigationHandlers as jest.Mock).mockReturnValueOnce(navigateToContentEntity);

        const navigatorApi = buildApi();
        navigatorApi.openAsset('my_id', { slideIn: false });
        expect(navigateToContentEntity).toHaveBeenCalledWith({
          entityType: 'Asset',
          slideIn: false,
          id: 'my_id',
        });
      });
    });

    describe('openNewAsset', () => {
      it('calls navigateToContentEntity with the correct arguments', () => {
        const navigateToContentEntity = jest.fn();
        (makeExtensionNavigationHandlers as jest.Mock).mockReturnValueOnce(navigateToContentEntity);

        const navigatorApi = buildApi();
        navigatorApi.openNewAsset({ slideIn: false });

        expect(navigateToContentEntity).toHaveBeenCalledWith({
          entityType: 'Asset',
          slideIn: false,
          id: null,
        });
      });
    });

    describe('openPageExtension', () => {
      it('navigates and does not notify when on page location and same context', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.EXTENSION,
          isOnPageLocation: true,
        });
        const path = '/somewhere';
        await navigatorApi.openPageExtension({ path, id: DEFAULT_WIDGET_ID });

        expect(Navigator.go).toHaveBeenCalledWith({
          options: {
            notify: false,
          },
          params: {
            environmentId: DEFAULT_ENVIRONMENT_ID,
            spaceId: DEFAULT_SPACE_ID,
            extensionId: DEFAULT_WIDGET_ID,
            path,
          },
          path: ['spaces', 'detail', 'pageExtensions'],
        });
      });
      it('navigates notifies when on page location and different context', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.EXTENSION,
          isOnPageLocation: true,
        });
        const path = '/somewhere';
        const id = 'something';
        await navigatorApi.openPageExtension({ path, id });

        expect(Navigator.go).toHaveBeenCalledWith({
          options: {
            notify: true,
          },
          params: {
            environmentId: DEFAULT_ENVIRONMENT_ID,
            spaceId: DEFAULT_SPACE_ID,
            extensionId: id,
            path,
          },
          path: ['spaces', 'detail', 'pageExtensions'],
        });
      });
      it('navigates notifies when not on page location', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.EXTENSION,
          isOnPageLocation: false,
        });
        const path = '/somewhere';
        const id = 'something';
        await navigatorApi.openPageExtension({ path, id });

        expect(Navigator.go).toHaveBeenCalledWith({
          options: {
            notify: true,
          },
          params: {
            environmentId: DEFAULT_ENVIRONMENT_ID,
            spaceId: DEFAULT_SPACE_ID,
            extensionId: id,
            path,
          },
          path: ['spaces', 'detail', 'pageExtensions'],
        });
      });
      it('navigates to self if id is not passed', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.EXTENSION,
          isOnPageLocation: false,
        });
        await navigatorApi.openPageExtension();

        expect(Navigator.go).toHaveBeenCalledWith({
          options: {
            notify: true,
          },
          params: {
            environmentId: DEFAULT_ENVIRONMENT_ID,
            spaceId: DEFAULT_SPACE_ID,
            extensionId: DEFAULT_WIDGET_ID,
            path: '',
          },
          path: ['spaces', 'detail', 'pageExtensions'],
        });
      });
      it('does not navigate with wrong path', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.EXTENSION,
          isOnPageLocation: false,
        });
        const path = 'wrong';
        await expect(navigatorApi.openPageExtension({ path })).rejects.toThrowError();

        expect(Navigator.go).not.toHaveBeenCalled();
      });
      it('does not navigate to different type', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.APP,
          isOnPageLocation: false,
        });
        await expect(navigatorApi.openPageExtension()).rejects.toThrowError();

        expect(Navigator.go).not.toHaveBeenCalled();
      });
    });

    describe('openCurrentAppPage', () => {
      it('navigates and does not notify when on page location and same context', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.APP,
          isOnPageLocation: true,
        });
        await navigatorApi.openCurrentAppPage({});

        expect(Navigator.go).toHaveBeenCalledWith({
          options: {
            notify: false,
          },
          params: {
            environmentId: DEFAULT_ENVIRONMENT_ID,
            spaceId: DEFAULT_SPACE_ID,
            appId: DEFAULT_WIDGET_ID,
            path: '',
          },
          path: ['spaces', 'detail', 'apps', 'page'],
        });
      });
      it('navigates notifies when not on page location', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.APP,
          isOnPageLocation: false,
        });
        const path = '/somewhere';
        await navigatorApi.openCurrentAppPage({ path });

        expect(Navigator.go).toHaveBeenCalledWith({
          options: {
            notify: true,
          },
          params: {
            environmentId: DEFAULT_ENVIRONMENT_ID,
            spaceId: DEFAULT_SPACE_ID,
            appId: DEFAULT_WIDGET_ID,
            path,
          },
          path: ['spaces', 'detail', 'apps', 'page'],
        });
      });
      it('does not navigate with wrong path', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.APP,
          isOnPageLocation: false,
        });
        const path = 'wrong';
        await expect(navigatorApi.openCurrentAppPage({ path })).rejects.toThrowError();

        expect(Navigator.go).not.toHaveBeenCalled();
      });
      it('does not navigate to different type', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.EXTENSION,
          isOnPageLocation: false,
        });
        await expect(navigatorApi.openCurrentAppPage()).rejects.toThrowError();

        expect(Navigator.go).not.toHaveBeenCalled();
      });
    });

    describe('openBulkEditor', () => {
      it('calls navigateToBulkEditor with the correct arguments', () => {
        const navigateToBulkEditor = jest.fn();
        (makeExtensionBulkNavigationHandlers as jest.Mock).mockReturnValueOnce(
          navigateToBulkEditor
        );

        const navigatorApi = buildApi();
        navigatorApi.openBulkEditor('entry_id', { fieldId: 'field_id', locale: 'fr', index: 3 });

        expect(navigateToBulkEditor).toHaveBeenCalledWith({
          entryId: 'entry_id',
          fieldId: 'field_id',
          locale: 'fr',
          index: 3,
        });
      });
    });

    describe('onSlideInNavigation', () => {
      it('calls onSlideInNavigation from SlideInNavigator module', () => {
        const callback = jest.fn();
        const navigatorApi = buildApi();
        navigatorApi.onSlideInNavigation(callback);
        expect(onSlideInNavigation).toHaveBeenCalledWith(callback);
      });
    });
  });
});
