'use strict';

describe('TheLocaleStore', function () {

  beforeEach(function () {
    module('contentful/test');
    inject(function () {
      this.theLocaleStore = this.$inject('TheLocaleStore');
      var cfStub = this.$inject('cfStub');
      this.space = cfStub.space('test');
      this.theLocaleStore.resetWithSpace(this.space);
    });
  });

  describe('refreshes locales', function () {
    var privateLocales;
    beforeEach(function () {
      privateLocales = [
        { code: 'en-US', internal_code: 'en-US' },
        { code: 'de-DE', internal_code: 'de-DE' }
      ];
      this.space.getPrivateLocales = sinon.stub().returns(privateLocales);
      this.space.getDefaultLocale  = sinon.stub().returns({
        code: 'en-US',
        internal_code: 'en-US'
      });

      this.theLocaleStore.refreshLocales();
    });

    it('private locales is the supplied array', function () {
      expect(this.theLocaleStore.getPrivateLocales()).toEqual(privateLocales);
    });

    it('gets default locale', function() {
      expect(this.theLocaleStore.getDefaultLocale()).toEqual(this.space.getDefaultLocale());
    });

    it('gets active locale states', function () {
      expect(this.theLocaleStore.getLocalesState().localeActiveStates).toEqual({
          'en-US': true
      });
    });

    it('gets updated active locales', function() {
      expect(this.theLocaleStore.getActiveLocales()).toEqual([
        { code: 'en-US', internal_code: 'en-US' }
      ]);
    });

    describe('changes active locales', function() {
      beforeEach(function() {
        this.theLocaleStore.setActiveStates({
          'en-US': true,
          'de-DE': true
        });
      });

      it('gets updated active locale states', function () {
        expect(this.theLocaleStore.getLocalesState().localeActiveStates).toEqual({
          'en-US': true,
          'de-DE': true
        });
      });

      it('gets updated active locales', function() {
        expect(this.theLocaleStore.getActiveLocales()).toEqual([
          { code: 'en-US', internal_code: 'en-US' },
          { code: 'de-DE', internal_code: 'de-DE' }
        ]);
      });

    });
  });


});
