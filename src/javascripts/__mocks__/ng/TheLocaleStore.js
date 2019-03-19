export default {
  getLocales: jest
    .fn()
    .mockImplementation(() => [
      { internal_code: 'en-US', code: 'en-US', default: true, name: 'English (United States)' },
      { internal_code: 'ru', code: 'ru', default: false, name: 'Russian' }
    ]),
  getActiveLocales: jest
    .fn()
    .mockImplementation(() => [
      { internal_code: 'en-US', code: 'en-US', default: true, name: 'English (United States)' },
      { internal_code: 'ru', code: 'ru', default: false, name: 'Russian' }
    ]),
  getPrivateLocales: jest
    .fn()
    .mockImplementation(() => [
      { internal_code: 'en-US', code: 'en-US', default: true, name: 'English (United States)' },
      { internal_code: 'ru', code: 'ru', default: false, name: 'Russian' }
    ]),
  setActiveLocales: jest.fn(),
  deactivateLocale: jest.fn(),
  getFocusedLocale: jest.fn().mockImplementation(() => ({
    internal_code: 'en-US',
    default: true,
    name: 'English (United States)'
  })),
  isLocaleActive: jest.fn(),
  isSingleLocaleModeOn: jest.fn(),
  getDefaultLocale: jest.fn().mockReturnValue({ code: 'en-US' })
};
