'use strict';

describe('cfUrlEditor directive', function () {
  beforeEach(function () {
    module('contentful/test');

    this.widgetApi = this.$inject('mocks/widgetApi').create({
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

    this.setStatus = function (status) {
      this.scope.urlStatus = status;
      this.$apply();
    };

    this.assertStatus = function (assertions) {
      var self = this;
      var statusEls = {
        invalid: self.$el.find('[data-status-code*=invalid]'),
        broken: self.$el.find('[data-status-code*=broken]')
      };

      assertions.forEach(function (assertion) {
        expect(statusEls[assertion[0]].css('display')).toBe(assertion[1]);
      });
    };

    this.$el = this.compileElement();
    this.scope = this.$el.isolateScope();
  });

  afterEach(function () {
    this.$el = null;
    this.scope.$destroy();
  });

  it('shows configured help text', function () {
    this.setHelpText('some help text');

    var helpText = this.compileElement().find('[role=note]').text();
    expect(helpText).toEqual('some help text');
  });

  it('shows nothing when no help text configured', function () {
    this.setHelpText(undefined);

    var helpText = this.compileElement().find('[role=note]').text();
    expect(helpText).toEqual('');
  });

  it('updates when new value is received over the wire', function () {
    expect(this.$el.find('input').val()).toEqual('omgwhat');
  });

  it('updates when url is modified by calling changeString', function () {
    var $inputEl = this.$el.find('input');

    /*
     * Since onValueChanged handler is called when attached
     * we reset call count setString as it is called
     * by the handler given to onValueChanged.
     * Handler is called when attached as the signal for it
     * is of type `memoized`. See createMemoized method in
     * signal.js
     */
    this.widgetApi.field.setString.reset();
    $inputEl.val('unicorns');
    $inputEl.trigger('input');

    sinon.assert.calledOnce(this.widgetApi.field.setString);
    sinon.assert.calledWithExactly(this.widgetApi.field.setString, 'unicorns');
  });

  it('should be disabled when disabled flag is set', function () {
    expect(this.$el.find('input').attr('disabled')).toEqual('disabled');
  });

  it('should show no errors when url is valid', function () {
    this.setStatus('ok');
    this.assertStatus([['invalid', 'none'], ['broken', 'none']]);
  });

  it('should show error on invalid url', function () {
    this.setStatus('invalid');
    this.assertStatus([['invalid', 'block'], ['broken', 'none']]);
  });

  it('should show error on broken url', function () {
    this.setStatus('broken');
    this.assertStatus([['invalid', 'none'], ['broken', 'block']]);
  });
});
