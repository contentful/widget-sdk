'use strict';

describe('cfUrlEditor directive', function () {
  beforeEach(function () {
    module('contentful/test');

    this.cfWidgetApi = {
      field: {
        onValueChanged: function (cb) {
          cb('omgwhat');
        },
        onDisabledStatusChanged: function (cb) {
          cb(true);
        },
        setString: sinon.stub()
      }
    };

    this.compileElement = function () {
      return this.$compile('<cf-url-editor>', {}, {
        cfWidgetApi: this.cfWidgetApi
      });
    };
  });

  it('updates when new value is received over the wire', function () {
    var $el = this.compileElement();

    expect($el.children('input.form-control').val()).toEqual('omgwhat');
  });

  it('updates when url is modified by calling changeString', function () {
    var $inputEl = this.compileElement().children('input.form-control');

    $inputEl.val('unicorns');
    $inputEl.trigger('input');

    sinon.assert.calledOnce(this.cfWidgetApi.field.setString);
    sinon.assert.calledWithExactly(this.cfWidgetApi.field.setString, 'unicorns');
  });

  it('should be disabled when disabled flag is set', function () {
    var $inputEl = this.compileElement().children('input.form-control');

    expect($inputEl.attr('disabled')).toEqual('disabled');
  });
});
