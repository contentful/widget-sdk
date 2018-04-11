'use strict';

describe('FieldDialogAppearanceController', function () {
  beforeEach(function () {
    module('contentful/test');
    var $controller = this.$inject('$controller');
    this.scope = this.$inject('$rootScope').$new();

    _.extend(this.scope, {
      field: { type: 'Number' },
      widgetSettings: {
        id: 'numberEditor',
        params: {},
      },
      contentType: {
        data: {}
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
      const widgets = this.$inject('widgets');
      widgets.applyDefaults = sinon.stub();
      this.scope.selectWidget(1);
      this.$apply();
      sinon.assert.calledOnce(widgets.applyDefaults);
      sinon.assert.calledWith(
        widgets.applyDefaults,
        this.scope.availableWidgets[1],
        this.scope.widgetParams
      );
    });
  });
});
