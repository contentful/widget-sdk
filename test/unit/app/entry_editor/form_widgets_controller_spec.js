'use strict';
import _ from 'lodash';

describe('FormWidgetsController#widgets', () => {
  beforeEach(function() {
    module('contentful/test');

    this.$inject('mocks/spaceContext').init();
    this.scope = this.$inject('$rootScope').$new();

    this.scope.editorContext = this.$inject('mocks/entityEditor/Context').create();
    this.scope.contentType = { getId: _.constant('ctid') };
    this.scope.preferences = {};

    this.field = {
      id: 'foo',
      apiName: 'foo'
    };

    const controls = [
      {
        widgetId: 'foo',
        fieldId: 'foo',
        field: this.field
      }
    ];

    this.createController = function() {
      const $controller = this.$inject('$controller');
      $controller('FormWidgetsController', { $scope: this.scope, controls });
      this.$apply();
    };
  });

  it('exposes enabled field', function() {
    this.createController();
    expect(this.scope.widgets.length).toBe(1);
  });

  describe('with disabled field', () => {
    beforeEach(function() {
      this.field.disabled = true;
      this.createController();
    });

    it('does not show the field', function() {
      this.$apply();
      expect(this.scope.widgets.length).toBe(0);
    });

    it('shows the fields if the preference flag is set', function() {
      this.scope.preferences.showDisabledFields = true;
      this.$apply();
      expect(this.scope.widgets.length).toBe(1);
    });

    it('shows the field if it has errors', function() {
      const validator = this.scope.editorContext.validator;
      validator.hasFieldError.withArgs('foo').returns(true);
      validator.errors$.set([]);
      expect(this.scope.widgets.length).toBe(1);
    });
  });
});
