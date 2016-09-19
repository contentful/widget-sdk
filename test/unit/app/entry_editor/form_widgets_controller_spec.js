'use strict';

describe('FormWidgetsController#widgets', function () {
  let scope, field;

  beforeEach(function () {
    module('contentful/test');

    scope = this.$inject('$rootScope').$new();

    scope.validator = {hasError: sinon.stub().returns(false)};

    field = {
      id: 'foo',
      apiName: 'foo'
    };

    const controls = [{
      widgetId: 'foo',
      fieldId: 'foo',
      field: field
    }];

    this.createController = function () {
      const $controller = this.$inject('$controller');
      $controller('FormWidgetsController', {
        $scope: scope,
        contentTypeId: '',
        controls: controls
      });
      this.$apply();
    };
  });


  it('exposes enabled field', function () {
    this.createController();
    expect(scope.widgets.length).toBe(1);
  });

  describe('with disabled field', function () {
    beforeEach(function () {
      scope.preferences = {};
      field.disabled = true;
      this.createController();
    });

    it('does not show the field', function () {
      this.$apply();
      expect(scope.widgets.length).toBe(0);
    });

    it('shows the fields if the preference flag is set', function () {
      scope.preferences.showDisabledFields = true;
      this.$apply();
      expect(scope.widgets.length).toBe(1);
    });

    it('shows the field if it has errors', function () {
      scope.validator.errors = {};
      scope.validator.hasError.returns(true);
      this.$apply();
      expect(scope.widgets.length).toBe(1);
    });
  });
});
