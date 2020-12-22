import * as localeUtils from './locales';

jest.mock('libs/locales_list.json', () => [{ code: 'ar-AE' }, { code: 'hr-BA' }]);
jest.mock('rtl-detect', () => ({
  isRtlLang: (code) => ['hr-BA', 'he-IL'].includes(code),
}));

describe('utils/locales', () => {
  describe('#isRtlLocale()', () => {
    describe('when the locale is not featured in the web app', () => {
      it('returns false', function () {
        expect(localeUtils.isRtlLocale('he-IL')).toBe(false);
      });
    });

    describe('when the locale is featured in the web app', () => {
      describe('when the locale code should be displayed as LTR', () => {
        it('returns false', function () {
          expect(localeUtils.isRtlLocale('ar-AE')).toBe(false);
        });
      });

      describe('when the locale code should be displayed as RTL', () => {
        it('returns true', function () {
          expect(localeUtils.isRtlLocale('hr-BA')).toBe(true);
        });
      });
    });
  });
});
