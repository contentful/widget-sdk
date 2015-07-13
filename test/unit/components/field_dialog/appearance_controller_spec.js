'use strict';

describe('FieldDialogAppearanceController', function () {

  beforeEach(module('contentful/test'));

  beforeEach(function () {
    var $controller = this.$inject('$controller');
    this.scope = this.$inject('$rootScope').$new();

    _.extend(this.scope, {
      field: { type: 'Number' },
      widgetSettings: {
        id: 'numberEditor',
        params: {},
      }
    });

    this.controller = $controller('FieldDialogAppearanceController', {$scope: this.scope});

    // Available widgets setup is asynchronous
    this.$apply();
  });

  it('provides a list of available widgets', function () {
    expect(Array.isArray(this.scope.availableWidgets));
  });

  describe('#selectWidget()', function () {

    beforeEach(function () {
      expect(this.scope.selectedWidgetIndex).toEqual(0);
    });

    it('sets the widgetId', function () {
      expect(this.scope.widgetSettings.id).not.toEqual('selectThis');
      this.scope.availableWidgets[1].id = 'selectThis';
      this.scope.selectWidget(1);

      expect(this.scope.widgetSettings.id).toEqual('selectThis');
    });

    it('it updates the widget options', function () {
      var widgetOption = {param: 'myparam'};

      this.scope.availableWidgets[1].options = [widgetOption];
      expect(this.scope.widgetOptions[0]).not.toBe(widgetOption);

      this.scope.selectWidget(1);
      this.$apply();
      expect(this.scope.widgetOptions[0]).toBe(widgetOption);
    });

    it('applies the default parameters', function () {
      expect(this.scope.widgetParams.myparam).toBeUndefined();
      this.scope.availableWidgets[1].options = [{
        param: 'myparam', default: true
      }];
      this.scope.selectWidget(1);
      this.$apply();

      expect(this.scope.widgetParams.myparam).toBe(true);
    });
  });
});
