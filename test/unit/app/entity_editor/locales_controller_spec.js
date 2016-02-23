'use strict';

describe('entityEditor/LocalesController', function () {

  beforeEach(function () {
    module('contentful/test');
    var $controller = this.$inject('$controller');
    this.createController = function () {
      return $controller('entityEditor/LocalesController');
    };
  });

  it('sets #active to locales from locale store', function () {
    var localeStore = this.$inject('TheLocaleStore');
    localeStore.getActiveLocales = sinon.stub().returns('ACTIVE');

    var controller = this.createController();
    expect(controller.active).toEqual('ACTIVE');
  });

  describe('#deactivate', function () {
    var locale = {internal_code: 'en'};

    beforeEach(function () {
      this.localeStore = this.$inject('TheLocaleStore');
      this.localeStore.resetWithSpace({
        getId: _.constant('sid'),
        getPrivateLocales: sinon.stub().returns([locale]),
        getDefaultLocale: sinon.stub().returns(true)
      });

      this.localeStore.setActiveLocales([locale]);
      this.controller = this.createController();
    });

    it('deactivates the locale in the locales store', function () {
      expect(this.localeStore.isLocaleActive(locale)).toBe(true);
      this.controller.deactivate(locale);
      expect(this.localeStore.isLocaleActive(locale)).toBe(false);
    });

    it('removes the locale from the #active property', function () {
      expect(this.controller.active).toEqual([locale]);
      this.controller.deactivate(locale);
      expect(this.controller.active).toEqual([]);
    });
  });
});
