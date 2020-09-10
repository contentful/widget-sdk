import { createNavigatorApi, createReadOnlyNavigatorApi } from './createNavigatorApi';
import { onSlideInNavigation } from 'navigation/SlideInNavigator/index';
import { WidgetNamespace } from '@contentful/widget-renderer';
import makePageExtensionHandlers from 'widgets/bridges/makePageExtensionHandlers';
import {
  makeExtensionNavigationHandlers,
  makeExtensionBulkNavigationHandlers,
} from 'widgets/bridges/makeExtensionNavigationHandlers';
import { makeReadOnlyApiError, ReadOnlyApi } from './createReadOnlyApi';

jest.mock('navigation/SlideInNavigator/index');
jest.mock('widgets/bridges/makeExtensionNavigationHandlers');
jest.mock('widgets/bridges/makePageExtensionHandlers');

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
    const spaceContext = {};
    const widgetNamespace = WidgetNamespace.APP;
    const widgetId = 'my_widget';
    const buildApi = () =>
      createNavigatorApi({
        spaceContext,
        widgetNamespace,
        widgetId,
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
      it('calls navigateToPage with the correct arguments', () => {
        const navigateToPage = jest.fn();
        (makePageExtensionHandlers as jest.Mock).mockReturnValueOnce(navigateToPage);

        const navigatorApi = buildApi();
        navigatorApi.openPageExtension({ path: 'somewhere', id: 'something' });

        expect(navigateToPage).toHaveBeenCalledWith({
          path: 'somewhere',
          id: 'something',
          type: WidgetNamespace.EXTENSION,
        });
      });
    });

    describe('openCurrentAppPage', () => {
      it('calls navigateToPage with the correct arguments', () => {
        const navigateToPage = jest.fn();
        (makePageExtensionHandlers as jest.Mock).mockReturnValueOnce(navigateToPage);

        const navigatorApi = buildApi();
        navigatorApi.openCurrentAppPage({ path: 'somewhere' });

        expect(navigateToPage).toHaveBeenCalledWith({
          path: 'somewhere',
          type: WidgetNamespace.APP,
        });
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
