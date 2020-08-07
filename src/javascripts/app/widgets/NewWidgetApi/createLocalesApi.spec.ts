import localeStore from 'services/localeStore';
jest.mock('services/localeStore');
import { LocalesAPI } from 'contentful-ui-extensions-sdk';
import { createLocalesApi } from './createLocalesApi';

describe('createLocalesApi', () => {
  let localesApi: LocalesAPI;
  beforeEach(() => {
    (localeStore.getDefaultLocale as jest.Mock).mockReturnValueOnce({
      code: 'en-US',
      internal_code: 'internalCode',
    });
    (localeStore.getPrivateLocales as jest.Mock).mockReturnValueOnce([
      { name: 'English', code: 'en-US' },
      { name: 'French', code: 'fr', fallbackCode: 'en-US', optional: true },
      { name: 'Hebrew', code: 'he', fallbackCode: 'en-US', optional: false },
    ]);
    localesApi = createLocalesApi();
  });

  it('contains available locales', () => {
    expect(localesApi.available).toEqual(['en-US', 'fr', 'he']);
  });

  it('contains the default locale', () => {
    expect(localesApi.default).toEqual('en-US');
  });

  it('contains the fallbacks', () => {
    expect(localesApi.fallbacks).toEqual({
      'en-US': undefined,
      fr: 'en-US',
      he: 'en-US',
    });
  });

  it('contains names for each locale', () => {
    expect(localesApi.names).toEqual({
      'en-US': 'English',
      fr: 'French',
      he: 'Hebrew',
    });
  });

  it('contains the optional property for each locale', () => {
    expect(localesApi.optional).toEqual({
      fr: true,
      he: false,
      'en-US': undefined,
      // TODO should it be possible for this value to be undefined?
      // types from UIE suggest no
    });
  });

  it('Specifies rtl or ltr for each locale, defaulting to rtl', () => {
    expect(localesApi.direction).toEqual({
      fr: 'ltr',
      'en-US': 'ltr',
      he: 'rtl',
    });
  });
});
