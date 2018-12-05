'use strict';
import _ from 'lodash';

describe('SidebarWidgetRender controller', function() {
  beforeEach(function() {
    module('contentful/test', function($provide, $controllerProvider) {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
      $controllerProvider.register('FieldLocaleController', function() {});
    });

    this.scope = Object.assign(this.$inject('$rootScope').$new(), {
      widget: { field: {} }
    });

    this.$inject('$controller')('SidebarWidgetRenderController', {
      $scope: this.scope,
      $injector: this.$inject('$injector')
    });
  });

  describe('assert properties on scope', function() {
    it('should attach field, locale and fieldLocale on scope', function() {
      const props = ['field', 'locale', 'fieldLocale'];

      props.forEach(prop => {
        if (!(prop in this.scope)) {
          fail(`${prop} not found on scope`); // for a better error msg
        }
      });
    });
  });
});
