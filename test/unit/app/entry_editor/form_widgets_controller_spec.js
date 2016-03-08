'use strict';

describe('FormWidgetsController#widgets', function () {
  var scope, field;

  beforeEach(function () {
    module('contentful/test');

    scope = this.$inject('$rootScope').$new();

    field = {
      id: 'foo',
      apiName: 'foo'
    };

    var controls = [{
      widgetId: 'foo',
      fieldId: 'foo',
      field: field
    }];

    this.createController = function () {
      var $controller = this.$inject('$controller');
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
      scope.errorPaths = {'foo': true};
      this.$apply();
      expect(scope.widgets.length).toBe(1);
    });
  });
});
