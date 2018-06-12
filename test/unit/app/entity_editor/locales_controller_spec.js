describe('entityEditor/LocalesController', () => {
  beforeEach(function () {
    module('contentful/test', $provide => {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
    });

    const $controller = this.$inject('$controller');
    this.localeStore = this.$inject('TheLocaleStore');

    this.createController = () => $controller('entityEditor/LocalesController');
  });

  it('sets #active to locales from locale store', function () {
    this.localeStore.getActiveLocales = sinon.stub().returns('ACTIVE');
    const controller = this.createController();
    expect(controller.active).toEqual('ACTIVE');
  });

  describe('#deactivate', () => {
    const locale = {
      sys: {space: {sys: {id: 'sid'}}},
      internal_code: 'en',
      default: true,
      contentManagementApi: true
    };

    beforeEach(function () {
      this.localeStore.setLocales([locale]);
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
