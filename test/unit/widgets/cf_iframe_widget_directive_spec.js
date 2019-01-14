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

  describe('"callSpaceMethod" handler', function() {
    it('dispatches call to spaceContext.cma', function() {
      this.$inject('spaceContext').cma = { createEntry: sinon.stub().resolves() };
      this.scope = this.compile().scope;
      this.callSpaceMethodHandler = this.widgetAPI.registerHandler.args[0][1];
      this.callSpaceMethodHandler('createEntry', [1, 2, 3]);
      sinon.assert.calledWithExactly(this.$inject('spaceContext').cma.createEntry, 1, 2, 3);
    });
  });

  describe('"openDialog" handler', function() {
    it('dispatches call to entitySelector.openFromExtension', function() {
      this.$inject('entitySelector').openFromExtension = sinon.stub().resolves();
      this.scope = this.compile().scope;
      this.openDialogHandler = this.widgetAPI.registerHandler.args[2][1];
      this.openDialogHandler('entitySelector', 'opts');
      sinon.assert.calledWithExactly(this.$inject('entitySelector').openFromExtension, 'opts');
    });
  });

  describe('"setInvalid" handler', function() {
    it('dispatches call to setInvalid on field controller', function() {
      this.scope = this.compile().scope;
      this.setInvalidHandler = this.widgetAPI.registerHandler.args[3][1];
      this.setInvalidHandler(true, 'en-public');
      sinon.assert.calledWithExactly(this.scope.fieldController.setInvalid, 'en-public', true);
    });
  });

  describe('"setActive" handler', function() {
    it('dispatches call to setActive on field locale', function() {
      this.scope = this.compile().scope;
      this.setActiveHandler = this.widgetAPI.registerHandler.args[4][1];
      this.setActiveHandler(true);
      sinon.assert.calledWithExactly(this.scope.fieldLocale.setActive, true);
    });
  });

  describe('"isDisabledChanged" handler', function() {
    it('sends new isDisabled value using the widget api', function() {
      this.scope = this.compile().scope;
      this.$apply();
      this.widgetAPI.send.reset();
      this.scope.fieldLocale.access.disabled = 'NEWVALUE';
      this.$apply();
      sinon.assert.calledOnce(this.widgetAPI.send);
      sinon.assert.calledWithExactly(this.widgetAPI.send, 'isDisabledChanged', ['NEWVALUE']);
    });
  });

  describe('field value changes', function() {
    beforeEach(function() {
      this.scope = this.compile().scope;
    });

    it('sends localized field value change', function() {
      this.otDoc.setValueAt(['fields', 'FIELD', 'LOCALE'], 'VALUE');
      this.otDoc.changes.emit(['fields', 'FIELD', 'LOCALE']);
      this.$apply();
      sinon.assert.calledWithExactly(
        this.widgetAPI.update,
        ['fields', 'FIELD', 'LOCALE'],
        sinon.match.has('fields', sinon.match.has('FIELD', sinon.match.has('LOCALE', 'VALUE')))
      );
    });

    it('sends field value change for each locale', function() {
      this.$inject('TheLocaleStore').getPrivateLocales.returns([
        { internal_code: 'LOC A' },
        { internal_code: 'LOC B' },
        { internal_code: 'LOC C' }
      ]);

      this.otDoc.setValueAt(['fields', 'FIELD'], {
        'LOC A': 'VAL A',
        'LOC B': 'VAL B'
      });
      this.otDoc.changes.emit(['fields', 'FIELD']);
      this.$apply();

      sinon.assert.calledWithExactly(
        this.widgetAPI.update,
        ['fields', 'FIELD'],
        sinon.match.has(
          'fields',
          sinon.match.has(
            'FIELD',
            sinon.match({
              'LOC A': 'VAL A',
              'LOC B': 'VAL B',
              'LOC C': undefined
            })
          )
        )
      );
    });

    it('does not send field value changes if path does not start with "fields"', function() {
      this.otDoc.changes.emit(['NOT fields', 'FIELD']);
      this.$apply();
      sinon.assert.notCalled(this.widgetAPI.update);
    });
  });

  describe('"setValue" handler', function() {
    it('delegates with path translated path to "otDoc"', function() {
      let handler;
      this.widgetAPI.registerPathHandler.withArgs('setValue').callsFake((_, fn) => {
        handler = (field, locale, val) => {
          if (field === 'PUBLIC FIELD' && locale === 'PUBLIC LOCALE') {
            fn(['fields', 'internal', 'path'], val);
          }
        };
      });

      this.scope = this.compile().scope;
      this.otDoc.setValueAt = sinon.stub().resolves();

      handler('PUBLIC FIELD', 'PUBLIC LOCALE', 'VAL');

      sinon.assert.calledWithExactly(this.otDoc.setValueAt, ['fields', 'internal', 'path'], 'VAL');
    });

    it('rejects with API error code when update fails', async function() {
      this.scope = this.compile().scope;
      this.otDoc.setValueAt = sinon.stub().rejects();
      const handler = this.widgetAPI.registerPathHandler.withArgs('setValue').args[0][1];
      const errored = sinon.stub();
      await handler('PUBLIC FIELD', 'PUBLIC LOCALE', 'VAL').catch(errored);
      sinon.assert.calledWithExactly(errored, sinon.match({ code: 'ENTRY UPDATE FAILED' }));
    });
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
