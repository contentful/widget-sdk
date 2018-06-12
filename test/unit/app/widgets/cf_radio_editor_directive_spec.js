'use strict';

describe('cfRadioEditor Directive', () => {
  let fieldApi;

  beforeEach(function () {
    module('contentful/test');

    this.widgetApi = this.$inject('mocks/widgetApi').create();
    fieldApi = this.widgetApi.field;

    this.compile = function () {
      return this.$compile('<cf-radio-editor />', {}, {
        cfWidgetApi: this.widgetApi
      });
    };
  });

  function selectOption ($el, label) {
    const option = $el.find('label').filter(function () {
      return $(this).text() === label;
    });
    option.find('input')
    .click()
    .prop('checked', true)
    .trigger('click');
  }


  it('renders option tags for predefined values', function () {
    const predefined = ['banana', 'orange', 'strawberry'];
    fieldApi.validations = [{ in: predefined }];
    const element = this.compile();
    const labels = element.find('label').map(function () {
      return $(this).text();
    }).get();

    expect(labels).toEqual(predefined);
  });

  it('selects the initial value', function () {
    fieldApi.validations = [{in: ['initial']}];
    this.widgetApi.fieldProperties.value$.set('initial');
    const element = this.compile();
    expect(element.find('input:checked').next()[0].firstChild.nodeValue).toEqual('initial');
  });

  it('selects nothing when field data is undefined', function () {
    fieldApi.validations = [{in: ['initial']}];
    const element = this.compile();
    expect(element.find('input:checked').length).toBe(0);
  });

  it('selects another option when the value changes', function () {
    fieldApi.validations = [{in: ['value']}];
    const element = this.compile();
    expect(element.find('input:checked').length).toBe(0);

    this.widgetApi.fieldProperties.value$.set('value');
    this.$apply();
    expect(element.find('input:checked').next()[0].firstChild.nodeValue).toEqual('value');
  });

  it('is disbled when widgetApi emits disabled event', function () {
    fieldApi.validations = [{in: ['value']}];
    const input = this.compile().find('input');
    expect(input.prop('disabled')).toBe(false);
    this.widgetApi.fieldProperties.isDisabled$.set(true);
    this.$apply();
    expect(input.prop('disabled')).toBe(true);
  });

  it('assigns name attribute to input', function () {
    fieldApi.id = 'FID';
    fieldApi.locale = 'en';
    fieldApi.validations = [{in: ['a', 'b', 'c']}];
    const input = this.compile().find('input');
    input.each(function () {
      expect(this.getAttribute('name')).toMatch(/^entity\.FID\.en/);
    });
  });

  it('shows warning when there are no predefined values', function () {
    fieldApi.validations = [];
    const el = this.compile();
    const alert = el.find('[role=alert]');
    expect(alert.text()).toMatch('The widget failed to initialize');
  });


  describe('selecting an option', () => {
    beforeEach(() => {
      const predefined = ['banana', 'orange', 'strawberry'];
      fieldApi.validations = [{ in: predefined }];
    });

    it('changes value', function () {
      const element = this.compile();
      selectOption(element, 'banana');
      sinon.assert.calledWith(fieldApi.setValue, 'banana');
    });

    it('changes value to "undefined" if no option selected', function () {
      const element = this.compile();
      selectOption(element, 'Choose a value');
      sinon.assert.calledWith(fieldApi.setValue, undefined);
    });

    it('calls #setValue with number for Number fields', function () {
      const predefined = [1, '2.71', 3];
      fieldApi.validations = [{ in: predefined }];
      fieldApi.type = 'Number';
      const element = this.compile();
      selectOption(element, '2.71');
      sinon.assert.calledWith(fieldApi.setValue, 2.71);
    });

    it('calls #setValue with number for Integer fields', function () {
      const predefined = [1, '2', 3];
      fieldApi.validations = [{ in: predefined }];
      fieldApi.type = 'Number';
      const element = this.compile();
      selectOption(element, '2');
      sinon.assert.calledWith(fieldApi.setValue, 2);
    });
  });
});
