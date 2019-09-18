import _ from 'lodash';
import sinon from 'sinon';
import { $initialize, $compile, $inject, $apply } from 'test/helpers/helpers';
import { beforeEach, it } from 'test/helpers/dsl';

describe('cfUrlEditor directive', () => {
  beforeEach(async function() {
    this.system.set('lodash/debounce', {
      default: _.identity
    });

    await $initialize(this.system);

    this.widgetApi = $inject('mocks/widgetApi').create();

    this.setHelpText = function(helpText) {
      this.widgetApi.settings.helpText = helpText;
    };

    this.compileElement = function() {
      return $compile(
        '<cf-url-editor>',
        {},
        {
          cfWidgetApi: this.widgetApi
        }
      );
    };

    this.$el = this.compileElement();
    this.scope = this.$el.isolateScope();

    this.setStatus = function(status) {
      this.scope.urlStatus = status;
      $apply();
    };

    this.assertStatus = function(assertions) {
      const self = this;
      const statusEls = {
        invalid: self.$el.find('[data-status-code*=invalid]'),
        broken: self.$el.find('[data-status-code*=broken]')
      };

      assertions.forEach(assertion => {
        expect(statusEls[assertion[0]].css('display')).toBe(assertion[1]);
      });
    };
  });

  afterEach(function() {
    this.$el.remove();
    this.scope.$destroy();
  });

  it('updates when new value is received over the wire', function() {
    this.widgetApi.field.onValueChanged.yield('omgwhat');
    expect(this.$el.find('input').val()).toEqual('omgwhat');
  });

  it('updates when url is modified by calling changeString', function() {
    const $inputEl = this.$el.find('input');

    /*
     * Since onValueChanged handler is called when attached
     * we reset call count setValue as it is called
     * by the handler given to onValueChanged.
     * Handler is called when attached as the signal for it
     * is of type `memoized`. See createMemoized method in
     * signal.js
     */
    this.widgetApi.field.setValue.reset();
    $inputEl.val('unicorns');
    $inputEl.trigger('input');

    sinon.assert.calledOnce(this.widgetApi.field.setValue);
    sinon.assert.calledWithExactly(this.widgetApi.field.setValue, 'unicorns');
  });

  it('should be disabled when disabled flag is set', function() {
    expect(this.$el.find('input').prop('disabled')).toEqual(false);
    this.widgetApi.fieldProperties.isDisabled$.set(true);
    $apply();
    expect(this.$el.find('input').prop('disabled')).toEqual(true);
  });

  it('should show no errors when url is valid', function() {
    this.setStatus('ok');
    this.assertStatus([['invalid', 'none'], ['broken', 'none']]);
  });

  it('should show error on invalid url', function() {
    expect(this.$el.find('input').attr('aria-invalid')).toEqual('false');
    this.setStatus('invalid');

    expect(this.$el.find('input').attr('aria-invalid')).toEqual('true');
    this.assertStatus([['invalid', 'block'], ['broken', 'none']]);
  });

  it('should show error on broken url', function() {
    expect(this.$el.find('input').attr('aria-invalid')).toEqual('false');
    this.setStatus('broken');
    expect(this.$el.find('input').attr('aria-invalid')).toEqual('true');
    this.assertStatus([['invalid', 'none'], ['broken', 'block']]);
  });

  it('sets field validity according to URL status', function() {
    expect(this.widgetApi._state.isInvalid).toEqual(false);
    this.setStatus('broken');
    expect(this.widgetApi._state.isInvalid).toEqual(true);
    this.setStatus('ok');
    expect(this.widgetApi._state.isInvalid).toEqual(false);
    this.setStatus('invalid');
    expect(this.widgetApi._state.isInvalid).toEqual(true);
  });
});
