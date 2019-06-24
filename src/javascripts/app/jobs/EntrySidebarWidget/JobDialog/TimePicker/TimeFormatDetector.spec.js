import 'jest-dom/extend-expect';

import { getPreferredTimeFormat, TimeFormat } from './TimeFormatDetector.es6';

const languageSpy = jest.spyOn(window.navigator, 'language', 'get');
const languagesSpy = jest.spyOn(window.navigator, 'languages', 'get');

describe('TimeFormatDetector', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    languageSpy.mockRestore();
    languagesSpy.mockRestore();
  });

  it.each([['de-DE'], ['ru-RU'], ['uk-RU']])('returns 24h for non us locales %p', lang => {
    languagesSpy.mockReturnValue([lang]);
    expect(getPreferredTimeFormat()).toBe(TimeFormat.H24);
  });

  it.each([['en-US'], ['en-GB']])('returns 24 for us locales %p', lang => {
    languagesSpy.mockReturnValue([lang]);
    expect(getPreferredTimeFormat()).toBe(TimeFormat.H12);
  });

  it('falls back to navigator.language', () => {
    languagesSpy.mockReturnValue(undefined);
    languageSpy.mockReturnValue('en-US');
    expect(getPreferredTimeFormat()).toBe(TimeFormat.H12);
  });

  it('falls back to 24h', () => {
    languagesSpy.mockReturnValue(undefined);
    languageSpy.mockReturnValue(undefined);
    expect(getPreferredTimeFormat()).toBe(TimeFormat.H24);
  });
});
