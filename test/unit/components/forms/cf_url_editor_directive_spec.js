'use strict';

describe('cfUrlEditor directive', function () {
  beforeEach(function () {
    module('contentful/test');

    this.widgetApi = this.$inject('mocks/widgetApi')({
      field: {
        onValueChanged: sinon.stub().yields('omgwhat'),
        onDisabledStatusChanged: sinon.stub().yields(true)
      }
    });

    this.setHelpText = function (helpText) {
      this.widgetApi.settings.helpText = helpText;
    };

    this.compileElement = function () {
      return this.$compile('<cf-url-editor>', {}, {
        cfWidgetApi: this.widgetApi
      });
    };
  });

  it('shows configured help text', function () {
    this.setHelpText('some help text');

    var helpText = this.compileElement().children('.form-widget__help-text').text();
    expect(helpText).toEqual('some help text');
  });

  it('shows nothing when no help text configured', function () {
    this.setHelpText(undefined);

    var helpText = this.compileElement().children('.form-widget__help-text').text();
    expect(helpText).toEqual('');
  });

  it('updates when new value is received over the wire', function () {
    var $el = this.compileElement();

    expect($el.children('input.form-control').val()).toEqual('omgwhat');
  });

  it('updates when url is modified by calling changeString', function () {
    var $inputEl = this.compileElement().children('input.form-control');

    $inputEl.val('unicorns');
    $inputEl.trigger('input');

    sinon.assert.calledOnce(this.widgetApi.field.setString);
    sinon.assert.calledWithExactly(this.widgetApi.field.setString, 'unicorns');
  });

  it('should be disabled when disabled flag is set', function () {
    var $inputEl = this.compileElement().children('input.form-control');

    expect($inputEl.attr('disabled')).toEqual('disabled');
  });
});
