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
    this.scope.availableWidgets = [
      {id: 'numberEditor', options: []},
      {}
    ];
    this.$apply();
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
      var widgetOptions = [{param: 'myparam'}];
      this.scope.availableWidgets[1].options = widgetOptions;

      expect(this.scope.widgetOptions).not.toEqual(widgetOptions);
      this.scope.selectWidget(1);
      this.$apply();
      expect(this.scope.widgetOptions).toEqual(widgetOptions);
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
