'use strict';

describe('cfMultiLineEditor directive', function () {
  beforeEach(function () {
    module('contentful/test');

    const widgetApi = this.$inject('mocks/widgetApi').create();
    this.fieldApi = widgetApi.field;

    this.compile = function () {
      return this.$compile('<cf-multi-line-editor>', {}, {
        cfWidgetApi: widgetApi
      });
    };
  });

  it('updates correctly when value change is indicated by sharejs', function () {
    const $el = this.compile();

    this.fieldApi.onValueChanged.yield('test');
    expect($el.find('textarea').val()).toEqual('test');
  });

  it('input event on text field calls "setValue()"', function () {
    const $el = this.compile();

    $el.find('textarea').val('NEW').trigger('input');
    this.$apply();
    sinon.assert.calledOnce(this.fieldApi.setValue);
    sinon.assert.calledWithExactly(this.fieldApi.setValue, 'NEW');
  });

  it('enables and disables textare based on field status', function () {
    const $el = this.compile();
    const textarea = $el.find('textarea');

    this.fieldApi.onIsDisabledChanged.yield(true);
    this.$apply();
    expect(textarea.prop('disabled')).toBe(true);

    this.fieldApi.onIsDisabledChanged.yield(false);
    this.$apply();
    expect(textarea.prop('disabled')).toBe(false);
  });

  it('sets textarea invalid when there are schema errors', function () {
    const $el = this.compile();
    const textarea = $el.find('textarea');

    this.fieldApi.onSchemaErrorsChanged.yield(null);
    this.$apply();
    expect(textarea.attr('aria-invalid')).toBe('');
    this.fieldApi.onSchemaErrorsChanged.yield([{}]);
    this.$apply();
    expect(textarea.attr('aria-invalid')).toBe('true');
  });
});
