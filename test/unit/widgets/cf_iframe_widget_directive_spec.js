import * as K from 'test/helpers/mocks/kefir';

describe('cfIframeWidget directive', function() {
  beforeEach(function() {
    this.widgetAPI = {
      registerHandler: sinon.stub(),
      registerPathHandler: sinon.stub(),
      send: sinon.stub(),
      update: sinon.stub(),
      destroy: sinon.stub(),
      connect: sinon.stub()
    };

    module('contentful/test', $provide => {
      const { widgetAPI } = this;
      const locale = { internal_code: 'LOCALE-internal', code: 'LOCALE', default: true };

      $provide.constant('widgets/ExtensionAPI.es6', {
        // Used with `new` so we need to provide a function
        default: function() {
          return widgetAPI;
        }
      });
      $provide.constant('TheLocaleStore', {
        getPrivateLocales: sinon.stub().returns([locale]),
        getDefaultLocale: sinon.stub().returns(locale)
      });
    });

    const createDocument = this.$inject('mocks/entityEditor/Document').create;
    this.otDoc = createDocument();
    this.$inject('mocks/spaceContext').init();

    this.compile = (widget = {}) => {
      const element = this.$compile('<cf-iframe-widget />', {
        widget,
        entityInfo: {
          contentType: {
            fields: [{ id: 'FIELD', localized: true }]
          }
        },
        otDoc: this.otDoc,
        fieldLocale: {
          access: {
            disabled: true
          },
          errors$: K.createMockProperty(),
          setActive: sinon.spy()
        },
        fieldController: {
          setInvalid: sinon.spy()
        }
      });

      return { scope: element.scope(), element };
    };
  });

  describe('iframe', function() {
    it('sets src if widget has src property', function() {
      const widget = { src: 'http://test.com' };
      const { element } = this.compile(widget);
      const $iframe = element.find('iframe');
      expect($iframe.attr('src')).toBe(widget.src);
      expect($iframe.attr('srcdoc')).toBeUndefined();

      // src iframes should have `sanbox="allow-same-origin"`
      expect($iframe.attr('sandbox').includes('allow-same-origin')).toBe(true);
    });

    it('sets srcdoc if widget has srcdoc property', function() {
      const widget = { srcdoc: '<!DOCTYPE html>test' };
      const { element } = this.compile(widget);
      const $iframe = element.find('iframe');
      expect($iframe.attr('src')).toBeUndefined();
      expect($iframe.attr('srcdoc')).toBe(widget.srcdoc);

      // srcdoc iframes must not have `sanbox="allow-same-origin"`
      expect($iframe.attr('sandbox').includes('allow-same-origin')).toBe(false);
    });

    it('disallows extensions hosted on the app domain', function() {
      // `app.test.com` is the domain of the Web App while in test
      [
        'http://app.test.com',
        'https://app.test.com/i-injected-this',
        '//app.test.com/foo',
        'https://foo.app.test.com/bar'
      ].forEach(src => {
        const { element } = this.compile({ src });
        const $iframe = element.find('iframe');
        expect($iframe.attr('src')).toBeUndefined();
        expect($iframe.attr('srcdoc')).toBeUndefined();
      });
    });

    it('connects the widget API when iframe loads', function() {
      this.element = this.compile().element;
      this.widgetAPI.connect = sinon.stub();
      const iframe = this.element.find('iframe').get(0);
      iframe.dispatchEvent(new window.Event('load'));
      this.$apply();
      sinon.assert.calledOnce(this.widgetAPI.connect);
    });
  });
});
