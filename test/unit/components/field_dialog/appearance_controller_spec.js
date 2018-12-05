import _ from 'lodash';

describe('FieldDialogAppearanceController', () => {
  beforeEach(function() {
    module('contentful/test');
    const $controller = this.$inject('$controller');
    this.scope = this.$inject('$rootScope').$new();

    _.extend(this.scope, {
      field: { type: 'Number' },
      widgetSettings: {
        id: 'numberEditor',
        params: {}
      },
      contentType: {
        data: {}
      }
    });

    this.controller = $controller('FieldDialogAppearanceController', { $scope: this.scope });
    this.scope.availableWidgets = [{ id: 'numberEditor', options: [] }, {}];
    this.$apply();
  });

  it('#selectWidget() sets the widgetId', function() {
    expect(this.scope.selectedWidgetIndex).toEqual(0);
    expect(this.scope.widgetSettings.id).not.toEqual('selectThis');
    this.scope.availableWidgets[1].id = 'selectThis';
    this.scope.selectWidget(1);
    expect(this.scope.widgetSettings.id).toEqual('selectThis');
  });
});
