import { createNavigatorApi } from './createNavigatorApi';
import { makeReadOnlyApiError, ReadOnlyApi } from './createReadOnlyApi';
import { WidgetNamespace } from '../../../features/widget-renderer';

describe('createNavigatorApi', () => {
  let navigatorApi;
  describe('when creating read-only API', () => {
    let allNonHandlerMethods, allMethods, allHandlerMethods;
    beforeEach(() => {
      navigatorApi = createNavigatorApi({
        spaceContext: {},
        widgetId: 'id',
        widgetNamespace: WidgetNamespace.APP,
        readOnly: true,
      });
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
});
