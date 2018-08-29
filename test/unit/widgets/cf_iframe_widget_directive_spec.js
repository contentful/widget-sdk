import * as K from 'helpers/mocks/kefir';
import { create as createDocument } from 'helpers/mocks/entity_editor_document';

describe('cfIframeWidget directive', function() {
  beforeEach(function() {
    this.widgetAPI = {
      registerHandler: sinon.stub(),
      send: sinon.stub(),
      destroy: sinon.stub(),
      connect: sinon.stub()
    };

    module('contentful/test', $provide => {
      // `widgets/API` is used with `new` so we need to provide a function
      const { widgetAPI } = this;
      $provide.value('widgets/API', function() {
        return widgetAPI;
      });
    });

    this.otDoc = createDocument();
    this.$inject('mocks/spaceContext').init();

    this.compile = (widget = {}) => {
      const element = this.$compile('<cf-iframe-widget />', {
        widget,
        entityInfo: {
          contentType: {
            fields: [{ id: 'FIELD' }]
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

  describe('"setInvalid" handler', function() {
    it('dispatches call to setInvalid on field controller', function() {
      this.scope = this.compile().scope;
      this.setInvalidHandler = this.widgetAPI.registerHandler.args[2][1];
      this.setInvalidHandler(true, 'en-public');
      sinon.assert.calledWithExactly(this.scope.fieldController.setInvalid, 'en-public', true);
    });
  });

  describe('"setActive" handler', function() {
    it('dispatches call to setActive on field locale', function() {
      this.scope = this.compile().scope;
      this.setActiveHandler = this.widgetAPI.registerHandler.args[3][1];
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
      this.widgetAPI.sendFieldValueChange = sinon.stub();
    });

    it('sends localized field value change', function() {
      this.otDoc.setValueAt(['fields', 'FIELD', 'LOCALE'], 'VALUE');
      this.otDoc.changes.emit(['fields', 'FIELD', 'LOCALE']);
      this.$apply();
      sinon.assert.calledWithExactly(
        this.widgetAPI.sendFieldValueChange,
        'FIELD',
        'LOCALE',
        'VALUE'
      );
    });

    it('sends field value change for each locale', function() {
      const fieldFactory = this.$inject('fieldFactory');
      fieldFactory.getLocaleCodes = sinon.stub().returns(['LOC A', 'LOC B', 'LOC C']);

      this.otDoc.setValueAt(['fields', 'FIELD'], {
        'LOC A': 'VAL A',
        'LOC B': 'VAL B'
      });
      this.otDoc.changes.emit(['fields', 'FIELD']);
      this.$apply();
      sinon.assert.calledWithExactly(
        this.widgetAPI.sendFieldValueChange,
        'FIELD',
        'LOC A',
        'VAL A'
      );
      sinon.assert.calledWithExactly(
        this.widgetAPI.sendFieldValueChange,
        'FIELD',
        'LOC B',
        'VAL B'
      );
      sinon.assert.calledWithExactly(
        this.widgetAPI.sendFieldValueChange,
        'FIELD',
        'LOC C',
        undefined
      );
    });

    it('does not send field value changes if path does not start with "fields"', function() {
      this.otDoc.changes.emit(['NOT fields', 'FIELD']);
      this.$apply();
      sinon.assert.notCalled(this.widgetAPI.sendFieldValueChange);
    });

    it('ignores unknown fields', function() {
      this.otDoc.changes.emit(['fields', 'UNKNOWN']);
      this.$apply();
      sinon.assert.notCalled(this.widgetAPI.sendFieldValueChange);
    });
  });

  describe('"setValue" handler', function() {
    beforeEach(function() {
      this.scope = this.compile().scope;
      this.widgetAPI.buildDocPath = sinon
        .stub()
        .withArgs('PUBLIC FIELD', 'PUBLIC LOCALE')
        .returns(['internal', 'path']);

      this.otDoc.setValueAt = sinon.stub().resolves();
    });

    it('delegates with path translated path to "otDoc"', function() {
      const handler = this.widgetAPI.registerHandler.withArgs('setValue').args[0][1];
      handler('PUBLIC FIELD', 'PUBLIC LOCALE', 'VAL');
      sinon.assert.calledWithExactly(this.otDoc.setValueAt, ['internal', 'path'], 'VAL');
    });

    it('rejects with API error code when update fails', function() {
      this.otDoc.setValueAt.rejects();
      const handler = this.widgetAPI.registerHandler.withArgs('setValue').args[0][1];
      const errored = sinon.stub();
      handler('PUBLIC FIELD', 'PUBLIC LOCALE', 'VAL').catch(errored);
      this.$apply();
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
