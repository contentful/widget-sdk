import * as BackendTracing from './BackendTracing';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { getQueryString } from 'utils/location';

jest.mock('utils/location', () => ({ getQueryString: jest.fn() }));

const mockedGetQueryString = getQueryString as unknown as jest.Mock<{ [key: string]: string }>;

describe('BackendTracing', function () {
  let store;

  beforeEach(() => {
    store = getBrowserStorage('session');
    store.remove('trace');
  });

  describe('#init()', function () {
    it('does nothing if no query value is present', function () {
      mockedGetQueryString.mockReturnValue({});
      BackendTracing.init();

      expect(store.get('trace')).toBeNull();
    });

    it('persist the query parameter value in session storage', function () {
      mockedGetQueryString.mockReturnValue({ trace: 'zd-1234' });
      BackendTracing.init();

      expect(store.get('trace')).toEqual('zd-1234');
    });
  });

  describe('#tracingHeaders()', function () {
    it('returns no headers without stored valued', function () {
      const headers = BackendTracing.tracingHeaders();

      expect(headers).toEqual({});
    });

    it('returns a header with stored value', function () {
      store.set('trace', 'zd-5678');
      const headers = BackendTracing.tracingHeaders();

      expect(headers).toEqual({ 'cf-trace': 'zd-5678' });
    });
  });
});
