'use strict';
import _ from 'lodash';

describe('SidebarWidgetRender controller', function() {
  beforeEach(function() {
    module('contentful/test', function($controllerProvider) {
      $controllerProvider.register('FieldLocaleController', function() {});
    });

    const { registerFactory } = this.$inject('NgRegistry.es6');
    registerFactory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
    this.scope = Object.assign(this.$inject('$rootScope').$new(), {
      widget: { field: {} }
    });

    const { registerController } = this.$inject('NgRegistry.es6');
    registerController('FieldLocaleController', function() {});

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
