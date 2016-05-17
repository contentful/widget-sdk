'use strict';

describe('cfDropdownEditor Directive', function () {
  var fieldApi;

  beforeEach(function () {
    module('contentful/test');

    var widgetApi = this.$inject('mocks/widgetApi')();

    fieldApi = widgetApi.field;

    this.compile = function () {
      return this.$compile('<cf-dropdown-editor />', {}, {
        cfWidgetApi: {field: fieldApi}
      });
    };
  });

  function selectOption ($el, label) {
    var $select = $el.find('select');
    var option = $select.find('option').filter(function () {
      return $(this).text() === label;
    });
    var value = option.attr('value');
    $select.val(value).trigger('change');
  }


  it('renders option tags for predefined values', function () {
    var predefined = ['banana', 'orange', 'strawberry'];
    fieldApi.validations = [{ in: predefined }];
    var element = this.compile();
    var labels = element.find('option').map(function (_, option) {
      return $(option).text();
    }).get();

    expect(labels).toEqual(['Choose a value'].concat(predefined));
  });

  it('selects the initial value', function () {
    fieldApi.validations = [{in: ['initial']}];
    fieldApi.onValueChanged.yields('initial');
    var element = this.compile();
    expect(element.find('option:selected').text()).toEqual('initial');
  });

  it('selects the default value when field data is undefined', function () {
    fieldApi.validations = [{in: ['initial']}];
    var element = this.compile();
    expect(element.find('option:selected').text()).toEqual('Choose a value');

    fieldApi.onValueChanged.yield(undefined);
    this.$apply();
    expect(element.find('option:selected').text()).toEqual('Choose a value');
  });

  it('selects another option when the value changes', function () {
    fieldApi.validations = [{in: ['value']}];
    var element = this.compile();
    expect(element.find('option:selected').text()).toEqual('Choose a value');

    fieldApi.onValueChanged.yield('value');
    this.$apply();
    expect(element.find('option:selected').text()).toEqual('value');
  });

  it('is disbled when widgetApi emits disabled event', function () {
    fieldApi.validations = [{in: ['value']}];
    var select = this.compile().find('select');
    expect(select.prop('disabled')).toBe(false);
    fieldApi.onDisabledStatusChanged.yield(true);
    this.$apply();
    expect(select.prop('disabled')).toBe(true);
  });

  it('shows warning when there are no predefined values', function () {
    fieldApi.validations = [];
    var el = this.compile();
    var alert = el.find('[role=alert]');
    expect(alert.text()).toMatch('The widget failed to initialize');
  });


  describe('selecting an option', function () {
    beforeEach(function () {
      var predefined = ['banana', 'orange', 'strawberry'];
      fieldApi.validations = [{ in: predefined }];
    });

    it('changes value', function () {
      var element = this.compile();
      selectOption(element, 'banana');
      sinon.assert.calledWith(fieldApi.setValue, 'banana');
    });

    it('changes value to "undefined" if no option selected', function () {
      var element = this.compile();
      selectOption(element, 'Choose a value');
      sinon.assert.calledWith(fieldApi.setValue, undefined);
    });

    it('calls #setValue with number for Number fields', function () {
      var predefined = [1, '2.71', 3];
      fieldApi.validations = [{ in: predefined }];
      fieldApi.type = 'Number';
      var element = this.compile();
      selectOption(element, '2.71');
      sinon.assert.calledWith(fieldApi.setValue, 2.71);
    });

    it('calls #setValue with number for Integer fields', function () {
      var predefined = [1, '2', 3];
      fieldApi.validations = [{ in: predefined }];
      fieldApi.type = 'Number';
      var element = this.compile();
      selectOption(element, '2');
      sinon.assert.calledWith(fieldApi.setValue, 2);
    });
  });
});
