import { getModule } from 'core/NgRegistry';
import { getQueryString } from 'utils/location';
import createViewPersistor, { reset } from 'data/ListViewPersistor';
import { getStore } from 'browserStorage';

jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));
jest.mock('utils/location', () => ({ getQueryString: jest.fn() }));

const moduleMocks = {
  $location: {
    search: jest.fn(),
    replace: jest.fn(),
  },
  spaceContext: {
    getId: jest.fn().mockReturnValue('SPACE_ID'),
    getEnvironmentId: jest.fn().mockReturnValue('ENV_ID'),
  },
};
getModule.mockImplementation((type) => moduleMocks[type]);

describe('ListViewPersistor', () => {
  let store, viewPersistor;
  afterEach(() => {
    getQueryString.mockClear();
  });

  const LEGACY_STORE_KEY = 'lastFilterQueryString.entries.SPACE_ID';
  const STORE_KEY = 'cf_webapp_lastfilter_entries_ENV_ID_SPACE_ID';

  const initViewPersistor = () => {
    reset();
    viewPersistor = createViewPersistor({ entityType: 'Entry' });
  };

  beforeEach(async () => {
    getQueryString.mockReturnValue({});
    store = getStore().forKey(STORE_KEY);
    initViewPersistor();
  });

  describe('migrate legacy', () => {
    it('migrates a legacy storage key', () => {
      getStore().forKey(LEGACY_STORE_KEY).set({ legacy: true });
      initViewPersistor();
      expect(getStore().forKey(LEGACY_STORE_KEY).get()).toBeNull();
      expect(getStore().forKey(STORE_KEY).get().legacy).toBe(true);
    });

    it('migrates contentTypeHidden true legacy querystring', () => {
      getQueryString.mockReturnValue({ contentTypeHidden: true });
      initViewPersistor();
      expect(viewPersistor.read().displayedFieldIds).toEqual(['updatedAt', 'author']);
      expect(viewPersistor.read().contentTypeHidden).toBeUndefined();
    });

    it('migrates contentTypeHidden false legacy querystring', () => {
      getQueryString.mockReturnValue({ contentTypeHidden: false });
      initViewPersistor();
      expect(viewPersistor.read().displayedFieldIds).toEqual([
        'contentType',
        'updatedAt',
        'author',
      ]);
      expect(viewPersistor.read().contentTypeHidden).toBeUndefined();
    });
  });

  describe('read, readKey and readKeys', () => {
    it('reads data from query string by default', () => {
      getQueryString.mockReturnValue({ fromSearch: true });
      initViewPersistor();
      expect(viewPersistor.read().fromSearch).toBe(true);
    });

    it('falls back to data from localStorage', () => {
      store.set({ test: true });
      expect(viewPersistor.read().test).toBe(true);
    });

    it('restores nested structure', () => {
      getQueryString.mockReturnValue({ 'x.y': true });
      initViewPersistor();
      expect(viewPersistor.read().x.y).toBe(true);
    });

    it('reads nested key', () => {
      getQueryString.mockReturnValue({ 'x.y': true });
      initViewPersistor();
      expect(viewPersistor.readKey('x.y')).toBe(true);
    });

    it('reads multiple keys', () => {
      getQueryString.mockReturnValue({ 'x.y': true, foo: 'bar' });
      initViewPersistor();
      expect(viewPersistor.readKeys(['x.y', 'foo'])).toEqual({ x: { y: true }, foo: 'bar' });
    });
  });

  describe('save and saveKey', () => {
    beforeAll(() => {
      jest.mock('./UiConfig/Blanks', () => ({
        getBlankAssetView: jest.fn().mockReturnValue({}),
        getBlankEntryView: jest.fn().mockReturnValue({}),
      }));
    });
    it('updates query string', () => {
      viewPersistor.save({ test: true });
      expect(moduleMocks.$location.search).toHaveBeenCalledWith('test=true');
    });

    it('removes "title" field from view settings', () => {
      viewPersistor.save({ title: 'New Title', test: true });
      expect(moduleMocks.$location.search).toHaveBeenCalledWith('test=true');
    });

    it('removes empty/null/undefined fields from view settings', () => {
      viewPersistor.save({ empty: '', n: null, u: undefined, test: true });
      expect(moduleMocks.$location.search).toHaveBeenCalledWith('test=true');
    });

    it('use dot notation for nested fields', () => {
      viewPersistor.save({ x: { y: 3 } });
    });

    it('it saves nested keys', () => {
      viewPersistor.saveKey('x.y', 3);
      expect(moduleMocks.$location.replace).toHaveBeenCalled();
      expect(viewPersistor.read().x.y).toBe(3);
    });

    it('puts last QS into the store', () => {
      viewPersistor.save({ test: true });
      expect(store.get()).toEqual({ test: true });
    });
  });
});
