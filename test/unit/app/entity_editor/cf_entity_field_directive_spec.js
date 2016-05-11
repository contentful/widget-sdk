'use strict';

describe('cfEntityField directive', function () {

  describe('#locales', function () {

    beforeEach(function () {
      module('contentful/test', function ($provide) {
        $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
        $provide.removeDirectives('otPath', 'cfWidgetApi', 'cfWidgetRenderer');
      });

      var TheLocaleStore = this.$inject('TheLocaleStore');
      TheLocaleStore.setLocales([
        {internal_code: 'DEF'},
        {internal_code: 'EN'}
      ]);

      this.compile = function (field) {
        return this.$compile('<cf-entity-field>', {
          widget: _.extend({field: field})
        }).scope();
      };
    });

    it('is default locale when field is not localized', function () {
      var scope = this.compile({localized: false});
      expect(scope.locales).toEqual([{internal_code: 'DEF'}]);
    });

    it('adds active locales when they change and if field is localized', function () {
      var TheLocaleStore = this.$inject('TheLocaleStore');
      TheLocaleStore.getActiveLocales = sinon.stub()
        .returns([{internal_code: 'ACTIVE'}]);

      var scope = this.compile({localized: true});
      expect(scope.locales).toEqual([{internal_code: 'ACTIVE'}]);

      TheLocaleStore.getActiveLocales.returns([{internal_code: 'ACTIVE NEW'}]);
      this.$apply();
      expect(scope.locales).toEqual([{internal_code: 'ACTIVE NEW'}]);
    });

    it('adds error locales', function () {
      var scope = this.compile({id: 'FID', localized: false});
      expect(scope.locales).toEqual([{internal_code: 'DEF'}]);

      scope.errorPaths = {'FID': ['EN']};
      scope.$digest();
      expect(scope.locales).toEqual([
        {internal_code: 'DEF'}, {internal_code: 'EN'}
      ]);
    });
  });
});
