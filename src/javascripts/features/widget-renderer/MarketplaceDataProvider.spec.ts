import { MarketplaceDataProvider } from './MarketplaceDataProvider';
import { WidgetNamespace } from './interfaces';

const DEFAULT_APP_ICON_URL = 'https://default-app-icon';
const DEFAULT_EXTENSION_ICON_URL = 'https://default-extension-icon';
const UNKNOWN_WIDGET_TYPE_ICON_URL = 'https://unknown-widget-type-icon';

describe('MarketplaceDataProvider', () => {
  let fetch: jest.Mock;
  let provider: MarketplaceDataProvider;

  beforeEach(() => {
    fetch = jest.fn();
    provider = new MarketplaceDataProvider(fetch, {
      defaultAppIconUrl: DEFAULT_APP_ICON_URL,
      defaultExtensionIconUrl: DEFAULT_EXTENSION_ICON_URL,
      unknownWidgetTypeIconUrl: UNKNOWN_WIDGET_TYPE_ICON_URL,
    });
  });

  describe('before prefetch', () => {
    it('uses internal ID as a slug', () => {
      expect(provider.getSlug(WidgetNamespace.APP, 'some-app-id')).toBe('some-app-id');
      expect(provider.getSlug(WidgetNamespace.EXTENSION, 'some-ext-id')).toBe('some-ext-id');
      expect(provider.getSlug(WidgetNamespace.BUILTIN, 'something')).toBe('something');
    });

    it('returns default icons for all widget namespaces', () => {
      expect(provider.getIconUrl(WidgetNamespace.APP, 'some-app')).toBe(DEFAULT_APP_ICON_URL);
      expect(provider.getIconUrl(WidgetNamespace.EXTENSION, 'some-ext')).toBe(
        DEFAULT_EXTENSION_ICON_URL
      );
      expect(provider.getIconUrl(WidgetNamespace.BUILTIN, 'something')).toBe(
        UNKNOWN_WIDGET_TYPE_ICON_URL
      );
    });
  });

  describe('prefetch', () => {
    it('does networking only once', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                fields: {
                  appDefinitionId: 'some-app-id',
                  slug: 'human-readable-app-id',
                },
              },
            ],
            includes: { Asset: [] },
          }),
      });

      await provider.prefetch();
      await provider.prefetch();

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('throws on network issues', async () => {
      fetch.mockResolvedValue({ ok: false });

      expect.assertions(2);

      try {
        await provider.prefetch();
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect(provider.getIconUrl(WidgetNamespace.APP, 'some-app')).toBe(DEFAULT_APP_ICON_URL);
      }
    });
  });

  describe('after prefetch', () => {
    it('returns slug for apps if present', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                fields: {
                  appDefinitionId: 'some-app-id',
                  slug: 'hello-world',
                },
              },
            ],
            includes: { Asset: [] },
          }),
      });

      await provider.prefetch();

      expect(provider.getSlug(WidgetNamespace.APP, 'some-app-id')).toBe('hello-world');
      expect(provider.getSlug(WidgetNamespace.APP, 'non-marketplace-app')).toBe(
        'non-marketplace-app'
      );
      expect(provider.getSlug(WidgetNamespace.EXTENSION, 'some-ext')).toBe('some-ext');
    });

    it('returns icon URL if present', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                fields: {
                  appDefinitionId: 'app1',
                  slug: 'app-1-slug',
                  icon: {
                    sys: {
                      id: 'existing-asset',
                    },
                  },
                },
              },
              {
                fields: {
                  appDefinitionId: 'app2',
                  slug: 'app-2-slug',
                  icon: {
                    sys: {
                      id: 'missing-asset',
                    },
                  },
                },
              },
            ],
            includes: {
              Asset: [
                {
                  sys: {
                    id: 'existing-asset',
                  },
                  fields: {
                    file: {
                      url: 'https://custom-app-icon',
                    },
                  },
                },
              ],
            },
          }),
      });

      await provider.prefetch();

      expect(provider.getIconUrl(WidgetNamespace.APP, 'app1')).toBe('https://custom-app-icon');
      expect(provider.getIconUrl(WidgetNamespace.APP, 'app2')).toBe(DEFAULT_APP_ICON_URL);
      expect(provider.getIconUrl(WidgetNamespace.EXTENSION, 'some-ext')).toBe(
        DEFAULT_EXTENSION_ICON_URL
      );
    });
  });
});
