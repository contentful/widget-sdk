'use strict';

describe('cfMultiLineEditor directive', function () {
  beforeEach(function () {
    module('contentful/test');

    var widgetApi = this.$inject('mocks/widgetApi').create();
    this.fieldApi = widgetApi.field;

    this.compile = function () {
      return this.$compile('<cf-multi-line-editor>', {}, {
        cfWidgetApi: widgetApi
      });
    };
  });

  it('updates correctly when value change is indicated by sharejs', function () {
    var $el = this.compile();

    this.fieldApi.onValueChanged.yield('test');
    expect($el.find('textarea').val()).toEqual('test');
  });

  it('input event on text field calls "setValue()"', function () {
    var $el = this.compile();

    $el.find('textarea').val('NEW').trigger('input');
    this.$apply();
    sinon.assert.calledOnce(this.fieldApi.setValue);
    sinon.assert.calledWithExactly(this.fieldApi.setValue, 'NEW');
  });

  it('enables and disables textare based on field status', function () {
    var $el = this.compile();
    var textarea = $el.find('textarea');

    this.fieldApi.onDisabledStatusChanged.yield(true);
    this.$apply();
    expect(textarea.prop('disabled')).toBe(true);

    this.fieldApi.onDisabledStatusChanged.yield(false);
    this.$apply();
    expect(textarea.prop('disabled')).toBe(false);
  });

  it('sets textarea invalid when there are schema errors', function () {
    var $el = this.compile();
    var textarea = $el.find('textarea');

    this.fieldApi.onSchemaErrorsChanged.yield(null);
    this.$apply();
    expect(textarea.attr('aria-invalid')).toBe('');
    this.fieldApi.onSchemaErrorsChanged.yield([{}]);
    this.$apply();
    expect(textarea.attr('aria-invalid')).toBe('true');
  });
});
