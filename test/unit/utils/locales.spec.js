import { createIsolatedSystem } from 'test/helpers/system-js';

describe('utils/locales', () => {
  beforeEach(function* () {
    const system = createIsolatedSystem();

    system.set('localesList', {
      default: [
        { code: 'ar-AE' },
        { code: 'hr-BA' }
      ]
    });

    system.set('rtl-detect', {
      isRtlLang: code => [
        'hr-BA',
        'he-IL'
      ].includes(code)
    });

    this.localeUtils = yield system.import('utils/locales');
  });

  describe('#isRtlLocale()', () => {
    describe('when the locale is not featured in the web app', () => {
      it('returns false', function () {
        expect(this.localeUtils.isRtlLocale('he-IL')).toBe(false);
      });
    });

    describe('when the locale is featured in the web app', () => {
      describe('when the locale code should be displayed as LTR', () => {
        it('returns false', function () {
          expect(this.localeUtils.isRtlLocale('ar-AE')).toBe(false);
        });
      });

      describe('when the locale code should be displayed as RTL', () => {
        it('returns true', function () {
          expect(this.localeUtils.isRtlLocale('hr-BA')).toBe(true);
        });
      });
    });
  });
});
