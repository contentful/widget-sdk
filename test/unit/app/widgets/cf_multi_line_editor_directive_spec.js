'use strict';

describe('cfMultiLineEditor directive', () => {
  beforeEach(function() {
    this.clock = sinon.useFakeTimers();
    module('contentful/test');

    this.widgetApi = this.$inject('mocks/widgetApi').create();
    this.fieldApi = this.widgetApi.field;

    this.compile = function() {
      return this.$compile(
        '<cf-multi-line-editor>',
        {},
        {
          cfWidgetApi: this.widgetApi
        }
      );
    };
  });

  afterEach(function() {
    this.clock.restore();
  });

  it('updates correctly when value change is indicated by sharejs', function() {
    const $el = this.compile();

    this.fieldApi.onValueChanged.yield('test');
    expect($el.find('textarea').val()).toEqual('test');
  });

  it('input event on text field calls "setValue()" after some time', function() {
    const $el = this.compile();

    const textarea = $el.find('textarea').get(0);
    textarea.value = 'NEW';
    textarea.dispatchEvent(new Event('input'));
    this.clock.tick(300);
    this.$apply();
    sinon.assert.calledOnce(this.fieldApi.setValue);
    sinon.assert.calledWithExactly(this.fieldApi.setValue, 'NEW');
  });

  it('enables and disables textare based on field status', function() {
    const $el = this.compile();
    const textarea = $el.find('textarea');

    this.widgetApi.fieldProperties.isDisabled$.set(true);
    this.$apply();
    expect(textarea.prop('disabled')).toBe(true);

    this.widgetApi.fieldProperties.isDisabled$.set(false);
    this.$apply();
    expect(textarea.prop('disabled')).toBe(false);
  });

  it('sets textarea invalid when there are schema errors', function() {
    const $el = this.compile();
    const textarea = $el.find('textarea');

    this.widgetApi.fieldProperties.schemaErrors$.set(null);
    this.$apply();
    expect(textarea.attr('aria-invalid')).toBe(undefined);
    this.widgetApi.fieldProperties.schemaErrors$.set([{}]);
    this.$apply();
    expect(textarea.attr('aria-invalid')).toBe('true');
  });
});
