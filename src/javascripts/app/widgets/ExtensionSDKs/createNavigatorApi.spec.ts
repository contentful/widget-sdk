import { createNavigatorApi, createReadOnlyNavigatorApi } from './createNavigatorApi';
import { onSlideLevelChanged } from 'navigation/SlideInNavigator/index';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { router } from 'core/react-routing';
import * as entityCreator from 'components/app_container/entityCreator';
import { makeReadOnlyApiError, ReadOnlyApi } from './createReadOnlyApi';

jest.mock('navigation/SlideInNavigator/withPromise');
jest.mock('navigation/SlideInNavigator/index');
jest.mock('states/Navigator');
jest.mock('components/app_container/entityCreator');
jest.mock('core/react-routing', () => ({
  router: {
    navigate: jest.fn(),
  },
}));

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
    const mockAsset = {
      sys: {
        id: 'asset_id',
        type: 'Entry',
        space: {
          id: DEFAULT_SPACE_ID,
        },
        environment: {
          id: DEFAULT_ENVIRONMENT_ID,
        },
      },
    };

    const mockEntry = {
      sys: {
        id: 'new-entry',
        type: 'Asset',
        space: {
          sys: {
            id: DEFAULT_SPACE_ID,
          },
        },
        environment: {
          sys: {
            id: DEFAULT_ENVIRONMENT_ID,
          },
        },
      },
    };

    const buildApi = ({
      widgetNamespace = DEFAULT_WIDGET_NAMESPACE,
      isOnPageLocation = false,
      spaceId = DEFAULT_SPACE_ID,
      environmentId = DEFAULT_ENVIRONMENT_ID,
      isMaster = true,
      cma = {},
    } = {}) =>
      createNavigatorApi({
        spaceId,
        environmentId,
        isMaster,
        cma,
        widgetNamespace,
        widgetId: DEFAULT_WIDGET_ID,
        isOnPageLocation,
      });

    describe('openEntry', () => {
      it('calls navigateToContentEntity with the correct arguments', async () => {
        const navigatorApi = buildApi({
          cma: {
            getEntry: () => Promise.resolve(mockEntry),
          },
        });
        const result = await navigatorApi.openEntry('my_id', { slideIn: true });
        expect(result).toEqual({
          navigated: true,
          entity: mockEntry,
        });
      });

      it('rejects on error in navigateToContentEntity with waitForClose', async () => {
        let err;
        const navigatorApi = buildApi({
          cma: {
            getEntry: () => Promise.reject({ code: 'SomeError' }),
          },
        });
        await navigatorApi
          .openEntry('my_id', { slideIn: { waitForClose: true } })
          .catch((e) => (err = e));
        expect(err).toBeTruthy();
      });

      it('resolves if entity not found after navigateToContentEntity with waitForClose', async () => {
        const navigatorApi = buildApi({
          cma: {
            getEntry: () => Promise.reject({ code: 'NotFound' }),
          },
        });
        const result = await navigatorApi.openEntry('my_id', { slideIn: { waitForClose: true } });
        expect(result).toEqual({
          navigated: true,
          entity: undefined,
        });
      });

      it('calls navigateToContentEntity with slideIn = false', async () => {
        const navigatorApi = buildApi({
          cma: {
            getEntry: () => Promise.resolve(mockEntry),
          },
        });
        const result = await navigatorApi.openEntry('my_id', { slideIn: false });
        expect(result).toEqual({
          navigated: true,
          entity: mockEntry,
        });
      });
    });

    describe('openNewEntry', () => {
      it('calls navigateToContentEntity with correct arguments', async () => {
        (entityCreator.newEntry as jest.Mock).mockReturnValue(mockEntry);

        const navigatorApi = buildApi({
          cma: {
            getEntry: () => Promise.resolve(mockEntry),
          },
        });
        const result = await navigatorApi.openNewEntry('content_type_id', { slideIn: true });
        expect(result).toEqual({
          navigated: true,
          entity: mockEntry,
        });
      });
    });

    describe('openAsset', () => {
      it('calls navigateToContentEntity with the correct arguments', async () => {
        const navigatorApi = buildApi({
          cma: {
            getAsset: () => Promise.resolve(mockAsset),
          },
        });

        const result = await navigatorApi.openAsset('known_asset_id', { slideIn: false });
        expect(result).toEqual({
          navigated: true,
          entity: mockAsset,
        });
      });
    });

    describe('openNewAsset', () => {
      it('calls navigateToContentEntity with the correct arguments', async () => {
        (entityCreator.newAsset as jest.Mock).mockReturnValue(mockAsset);

        const navigatorApi = buildApi({
          cma: {
            getAsset: () => Promise.resolve(mockAsset),
          },
        });
        const result = await navigatorApi.openNewAsset({ slideIn: false });

        expect(result).toEqual({
          navigated: true,
          entity: mockAsset,
          slide: undefined,
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

        expect(router.navigate).toHaveBeenCalledWith(
          {
            extensionId: DEFAULT_WIDGET_ID,
            path: 'page-extension',
            pathname: path,
            environmentId: DEFAULT_ENVIRONMENT_ID,
            spaceId: DEFAULT_SPACE_ID,
          },
          { notify: false }
        );
      });
      it('navigates notifies when on page location and different context', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.EXTENSION,
          isOnPageLocation: true,
        });
        const path = '/somewhere';
        const id = 'something';
        await navigatorApi.openPageExtension({ path, id });

        expect(router.navigate).toHaveBeenCalledWith(
          {
            extensionId: id,
            path: 'page-extension',
            pathname: path,
            environmentId: DEFAULT_ENVIRONMENT_ID,
            spaceId: DEFAULT_SPACE_ID,
          },
          { notify: true }
        );
      });
      it('navigates notifies when not on page location', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.EXTENSION,
          isOnPageLocation: false,
        });
        const path = '/somewhere';
        const id = 'something';
        await navigatorApi.openPageExtension({ path, id });

        expect(router.navigate).toHaveBeenCalledWith(
          {
            extensionId: id,
            path: 'page-extension',
            pathname: path,
            environmentId: DEFAULT_ENVIRONMENT_ID,
            spaceId: DEFAULT_SPACE_ID,
          },
          { notify: true }
        );
      });
      it('navigates to self if id is not passed', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.EXTENSION,
          isOnPageLocation: false,
        });
        await navigatorApi.openPageExtension();

        expect(router.navigate).toHaveBeenCalledWith(
          {
            extensionId: DEFAULT_WIDGET_ID,
            path: 'page-extension',
            pathname: '',
            environmentId: DEFAULT_ENVIRONMENT_ID,
            spaceId: DEFAULT_SPACE_ID,
          },
          { notify: true }
        );
      });
      it('does not navigate with wrong path', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.EXTENSION,
          isOnPageLocation: false,
        });
        const path = 'wrong';
        await expect(navigatorApi.openPageExtension({ path })).rejects.toThrowError();

        expect(router.navigate).not.toHaveBeenCalled();
      });
      it('does not navigate to different type', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.APP,
          isOnPageLocation: false,
        });
        await expect(navigatorApi.openPageExtension()).rejects.toThrowError();

        expect(router.navigate).not.toHaveBeenCalled();
      });
    });

    describe('openCurrentAppPage', () => {
      it('navigates and does not notify when on page location and same context', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.APP,
          isOnPageLocation: true,
        });
        await navigatorApi.openCurrentAppPage({});

        expect(router.navigate).toHaveBeenCalledWith(
          {
            path: 'apps.page',
            environmentId: DEFAULT_ENVIRONMENT_ID,
            spaceId: DEFAULT_SPACE_ID,
            appId: DEFAULT_WIDGET_ID,
            pathname: '',
          },
          { notify: false }
        );
      });
      it('navigates notifies when not on page location', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.APP,
          isOnPageLocation: false,
        });
        const path = '/somewhere';
        await navigatorApi.openCurrentAppPage({ path });

        expect(router.navigate).toHaveBeenCalledWith(
          {
            path: 'apps.page',
            environmentId: DEFAULT_ENVIRONMENT_ID,
            spaceId: DEFAULT_SPACE_ID,
            appId: DEFAULT_WIDGET_ID,
            pathname: path,
          },
          { notify: true }
        );
      });
      it('does not navigate with wrong path', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.APP,
          isOnPageLocation: false,
        });
        const path = 'wrong';
        await expect(navigatorApi.openCurrentAppPage({ path })).rejects.toThrowError();

        expect(router.navigate).not.toHaveBeenCalled();
      });
      it('does not navigate to different type', async () => {
        const navigatorApi = buildApi({
          widgetNamespace: WidgetNamespace.EXTENSION,
          isOnPageLocation: false,
        });
        await expect(navigatorApi.openCurrentAppPage()).rejects.toThrowError();

        expect(router.navigate).not.toHaveBeenCalled();
      });
    });

    describe('openBulkEditor', () => {
      it('calls navigateToBulkEditor with the correct arguments', async () => {
        const navigatorApi = buildApi();
        const result = await navigatorApi.openBulkEditor('entry_id', {
          fieldId: 'field_id',
          locale: 'fr',
          index: 3,
        });

        expect(result).toEqual({
          navigated: true,
        });
      });
    });

    describe('openAppConfig', () => {
      it('throws if called by an extension', () => {
        const navigatorApi = buildApi({ widgetNamespace: WidgetNamespace.EXTENSION });

        expect(() => navigatorApi.openAppConfig()).toThrow();
        expect(router.navigate).not.toHaveBeenCalled();
      });

      it('navigates to the config location', async () => {
        const navigatorApi = buildApi();
        await navigatorApi.openAppConfig();

        expect(router.navigate).toHaveBeenCalledWith(
          {
            path: 'apps.app-configuration',
            environmentId: DEFAULT_ENVIRONMENT_ID,
            spaceId: DEFAULT_SPACE_ID,
            appId: DEFAULT_WIDGET_ID,
          },
          {
            notify: true,
          }
        );
      });
    });

    describe('onSlideInNavigation', () => {
      it('calls onSlideInNavigation from SlideInNavigator module', () => {
        const callback = jest.fn();
        const navigatorApi = buildApi();
        navigatorApi.onSlideInNavigation(callback);
        expect(onSlideLevelChanged).toHaveBeenCalledWith(callback);
      });
    });
  });
});
