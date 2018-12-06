'use strict';

import $ from 'jquery';

describe('cfDropdownEditor Directive', () => {
  let fieldApi;

  beforeEach(function() {
    module('contentful/test');

    this.widgetApi = this.$inject('mocks/widgetApi').create();

    fieldApi = this.widgetApi.field;

    this.compile = function() {
      return this.$compile(
        '<cf-dropdown-editor />',
        {},
        {
          cfWidgetApi: { field: fieldApi }
        }
      );
    };
  });

  function selectOption($el, label) {
    const $select = $el.find('select');
    const option = $select.find('option').filter(function() {
      return $(this).text() === label;
    });
    const value = option.attr('value');
    $select.val(value).trigger('change');
  }

  it('renders option tags for predefined values', function() {
    const predefined = ['banana', 'orange', 'strawberry'];
    fieldApi.validations = [{ in: predefined }];
    const element = this.compile();
    const labels = element
      .find('option')
      .map((_, option) => $(option).text())
      .get();

    expect(labels).toEqual(['Choose a value'].concat(predefined));
  });

  it('selects the initial value', function() {
    fieldApi.validations = [{ in: ['initial'] }];
    this.widgetApi.fieldProperties.value$.set('initial');
    const element = this.compile();
    expect(element.find('option:selected').text()).toEqual('initial');
  });

  it('selects the default value when field data is undefined', function() {
    fieldApi.validations = [{ in: ['initial'] }];
    const element = this.compile();
    expect(element.find('option:selected').text()).toEqual('Choose a value');

    this.widgetApi.fieldProperties.value$.set(undefined);
    this.$apply();
    expect(element.find('option:selected').text()).toEqual('Choose a value');
  });

  it('selects another option when the value changes', function() {
    fieldApi.validations = [{ in: ['value'] }];
    const element = this.compile();
    expect(element.find('option:selected').text()).toEqual('Choose a value');

    this.widgetApi.fieldProperties.value$.set('value');
    this.$apply();
    expect(element.find('option:selected').text()).toEqual('value');
  });

  it('is disbled when widgetApi emits disabled event', function() {
    fieldApi.validations = [{ in: ['value'] }];
    const select = this.compile().find('select');
    expect(select.prop('disabled')).toBe(false);
    this.widgetApi.fieldProperties.isDisabled$.set(true);
    this.$apply();
    expect(select.prop('disabled')).toBe(true);
  });

  it('shows warning when there are no predefined values', function() {
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

    it('changes value', function() {
      const element = this.compile();
      selectOption(element, 'banana');
      sinon.assert.calledWith(fieldApi.setValue, 'banana');
    });

    it('changes value to "undefined" if no option selected', function() {
      const element = this.compile();
      selectOption(element, 'Choose a value');
      sinon.assert.calledWith(fieldApi.setValue, undefined);
    });

    it('calls #setValue with number for Number fields', function() {
      const predefined = [1, '2.71', 3];
      fieldApi.validations = [{ in: predefined }];
      fieldApi.type = 'Number';
      const element = this.compile();
      selectOption(element, '2.71');
      sinon.assert.calledWith(fieldApi.setValue, 2.71);
    });

    it('calls #setValue with number for Integer fields', function() {
      const predefined = [1, '2', 3];
      fieldApi.validations = [{ in: predefined }];
      fieldApi.type = 'Number';
      const element = this.compile();
      selectOption(element, '2');
      sinon.assert.calledWith(fieldApi.setValue, 2);
    });
  });
});
