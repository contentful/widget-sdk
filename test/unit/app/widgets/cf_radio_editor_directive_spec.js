'use strict';

describe('cfRadioEditor Directive', function () {
  var fieldApi;

  beforeEach(function () {
    module('contentful/test');

    var widgetApi = this.$inject('mocks/widgetApi').create();
    fieldApi = widgetApi.field;

    this.compile = function () {
      return this.$compile('<cf-radio-editor />', {}, {
        cfWidgetApi: widgetApi
      });
    };
  });

  function selectOption ($el, label) {
    var option = $el.find('label').filter(function () {
      return $(this).text() === label;
    });
    option.find('input')
    .click()
    .prop('checked', true)
    .trigger('click');
  }


  it('renders option tags for predefined values', function () {
    var predefined = ['banana', 'orange', 'strawberry'];
    fieldApi.validations = [{ in: predefined }];
    var element = this.compile();
    var labels = element.find('label').map(function () {
      return $(this).text();
    }).get();

    expect(labels).toEqual(predefined);
  });

  it('selects the initial value', function () {
    fieldApi.validations = [{in: ['initial']}];
    fieldApi.onValueChanged.yields('initial');
    var element = this.compile();
    expect(element.find('input:checked').parent().text()).toEqual('initial');
  });

  it('selects nothing when field data is undefined', function () {
    fieldApi.validations = [{in: ['initial']}];
    var element = this.compile();
    expect(element.find('input:checked').length).toBe(0);
  });

  it('selects another option when the value changes', function () {
    fieldApi.validations = [{in: ['value']}];
    var element = this.compile();
    expect(element.find('input:checked').length).toBe(0);

    fieldApi.onValueChanged.yield('value');
    this.$apply();
    expect(element.find('input:checked').parent().text()).toEqual('value');
  });

  it('is disbled when widgetApi emits disabled event', function () {
    fieldApi.validations = [{in: ['value']}];
    var input = this.compile().find('input');
    expect(input.prop('disabled')).toBe(false);
    fieldApi.onDisabledStatusChanged.yield(true);
    this.$apply();
    expect(input.prop('disabled')).toBe(true);
  });

  it('assigns name attribute to input', function () {
    fieldApi.id = 'FID';
    fieldApi.locale = 'en';
    fieldApi.validations = [{in: ['a', 'b', 'c']}];
    var input = this.compile().find('input');
    input.each(function () {
      expect(this.getAttribute('name')).toEqual('entity.FID.en');
    });
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
