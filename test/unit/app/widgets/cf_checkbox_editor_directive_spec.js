'use strict';

describe('cfCheckboxEditor directive', function () {
  beforeEach(function () {
    module('contentful/test');
    var widgetApi = this.$inject('mocks/widgetApi')({
      field: {
        itemValidations: [{in: ['A', 'B', 'C']}]
      }
    });

    this.fieldApi = widgetApi.field;

    this.el = this.$compile('<cf-checkbox-editor />', {}, {
      cfWidgetApi: widgetApi
    });
  });

  it('shows warning when there are no item validations', function () {
    this.fieldApi.itemValidations = undefined;
    var el = this.$compile('<cf-checkbox-editor />', {}, {
      cfWidgetApi: {field: this.fieldApi}
    });
    var alert = el.find('[role=alert]');
    expect(alert.text()).toMatch('The widget failed to initialize');
  });

  it('renders checkbox for each item validation', function () {
    var labels = this.el.find('label').map(function () {
      return $(this).text();
    }).get();
    expect(labels).toEqual(['A', 'B', 'C']);
  });

  it('checks checkboxes if values are changed remotely', function () {
    this.fieldApi.onValueChanged.yield(['C', 'A']);
    this.$apply();

    var checked = this.el.find('input[type=checkbox]').map(function () {
      return $(this).prop('checked');
    }).get();
    expect(checked).toEqual([true, false, true]);

    this.fieldApi.onValueChanged.yield(['B', 'A']);
    this.$apply();
    checked = this.el.find('input[type=checkbox]').map(function () {
      return $(this).prop('checked');
    }).get();
    expect(checked).toEqual([true, true, false]);
  });

  it('adds value to list if checked', function () {
    this.fieldApi.onValueChanged.yield(['A']);
    this.$apply();

    this.fieldApi.setValue.reset();

    this.el.find('label:contains(C)')
    .find('input[type=checkbox]')
    .prop('checked', true).trigger('click');

    sinon.assert.calledOnce(this.fieldApi.setValue);
    sinon.assert.calledWithExactly(this.fieldApi.setValue, ['A', 'C']);
  });

  it('removes value form list if unchecked', function () {
    this.fieldApi.onValueChanged.yield(['A', 'C']);
    this.$apply();
    this.fieldApi.setValue.reset();

    this.el.find('label:contains(C)')
    .find('input[type=checkbox]')
    .prop('checked', false).trigger('click');
    this.$apply();

    sinon.assert.calledOnce(this.fieldApi.setValue);
    sinon.assert.calledWithExactly(this.fieldApi.setValue, ['A']);
  });

  it('completely removes value when all boxes are unchecked', function () {
    this.fieldApi.onValueChanged.yield(['A']);
    this.$apply();

    this.fieldApi.removeValue.reset();
    this.el.find('label:contains(A)')
    .find('input[type=checkbox]')
    .prop('checked', false).trigger('click');
    this.$apply();

    sinon.assert.calledOnce(this.fieldApi.removeValue);
  });
});
