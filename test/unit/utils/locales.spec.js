import { createIsolatedSystem } from 'test/helpers/system-js';

describe('utils/locales', function () {
  beforeEach(function* () {
    const system = createIsolatedSystem();

    system.set('localesList', {
      default: [
        { code: 'ar-AE' },
        { code: 'hr-BA' }
      ]
    });

    system.set('libs/rtl-detect', {
      isRtlLang: code => [
        'hr-BA',
        'he-IL'
      ].includes(code)
    });

    this.localeUtils = yield system.import('utils/locales');
  });

  describe('#isRtlLocale()', function () {
    describe('when the locale is not featured in the web app', function () {
      it('returns false', function () {
        expect(this.localeUtils.isRtlLocale('he-IL')).toBe(false);
      });
    });

    describe('when the locale is featured in the web app', function () {
      describe('when the locale code should be displayed as LTR', function () {
        it('returns false', function () {
          expect(this.localeUtils.isRtlLocale('ar-AE')).toBe(false);
        });
      });

      describe('when the locale code should be displayed as RTL', function () {
        it('returns true', function () {
          expect(this.localeUtils.isRtlLocale('hr-BA')).toBe(true);
        });
      });
    });
  });
});
