'use strict';

describe('cfMultiLineEditor directive', function () {
  beforeEach(function () {
    module('cf.app');

    this.fieldApi = {
      onValueChanged: sinon.stub().returns(_.noop),
      onDisabledStatusChanged: sinon.stub().returns(_.noop)
    };

    this.compile = function () {
      return this.$compile('<cf-multi-line-editor>', {}, {
        cfWidgetApi: {field: this.fieldApi}
      });
    };
  });

  it('updates correctly when value change is indicated by sharejs', function () {
    var $el = this.compile();

    this.fieldApi.onValueChanged.yield('test');
    expect($el.find('textarea').val()).toEqual('test');
  });

  it('input event on text field calls "setString()"', function(){
    this.fieldApi.setString = sinon.stub();
    var $el = this.compile();

    $el.find('textarea').val('NEW').trigger('input');
    this.$apply();
    sinon.assert.calledOnce(this.fieldApi.setString);
    sinon.assert.calledWithExactly(this.fieldApi.setString, 'NEW');
  });

  it('enables and disables textare based on field status', function(){
    var $el = this.compile();
    var textarea = $el.find('textarea');

    this.fieldApi.onDisabledStatusChanged.yield(true);
    this.$apply();
    expect(textarea.prop('disabled')).toBe(true);

    this.fieldApi.onDisabledStatusChanged.yield(false);
    this.$apply();
    expect(textarea.prop('disabled')).toBe(false);
  });
});
