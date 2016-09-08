'use strict';

describe('cfIframeWidget directive', function () {
  var widgetAPI;

  afterEach(function () {
    widgetAPI = null;
  });

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.value('widgets/API', function () {
        return widgetAPI;
      });
    });

    this.otDoc = this.$inject('mocks/entityEditor/Document').create({
      fields: {}
    });

    var Widgets = this.$inject('widgets');
    Widgets.get = sinon.stub().returns({});

    widgetAPI = {
      registerHandler: sinon.stub(),
      send: sinon.stub(),
      destroy: sinon.stub()
    };

    this.element = this.$compile('<cf-iframe-widget>', {
      widget: {},
      entry: {},
      contentType: {
        data: {
          fields: [{id: 'FIELD'}]
        }
      },
      otDoc: this.otDoc,
      fieldLocale: {
        access: {
          disabled: true
        },
        setActive: sinon.spy()
      },
      fieldController: {
        setInvalid: sinon.spy()
      }
    });

    this.scope = this.element.scope();
  });

  describe('"setInvalid" handler', function () {
    beforeEach(function () {
      this.setInvalidHandler = widgetAPI.registerHandler.args[2][1];
    });

    it('dispatches call to setInvalid on field controller', function () {
      var locale = 'en-public';

      this.setInvalidHandler(true, locale);
      sinon.assert.calledWithExactly(this.scope.fieldController.setInvalid, locale, true);
    });
  });

  describe('"setActive" handler', function () {
    beforeEach(function () {
      this.setActiveHandler = widgetAPI.registerHandler.args[3][1];
    });

    it('dispatches call to setActive on field locale', function () {
      this.setActiveHandler(true);
      sinon.assert.calledWithExactly(this.scope.fieldLocale.setActive, true);
    });
  });

  describe('"isDisabledChanged" handler', function () {
    it('sends new isDisabled value using the widget api', function () {
      this.$apply();
      widgetAPI.send.reset();
      this.scope.fieldLocale.access.disabled = 'NEWVALUE';
      this.$apply();
      sinon.assert.calledOnce(widgetAPI.send);
      sinon.assert.calledWithExactly(widgetAPI.send, 'isDisabledChanged', ['NEWVALUE']);
    });
  });

  describe('field value changes', function () {
    beforeEach(function () {
      widgetAPI.sendFieldValueChange = sinon.stub();
    });

    it('sends localized field value change', function () {
      this.otDoc.setValueAt(['fields', 'FIELD', 'LOCALE'], 'VALUE');
      this.otDoc.changes.emit(['fields', 'FIELD', 'LOCALE']);
      this.$apply();
      sinon.assert.calledWithExactly(widgetAPI.sendFieldValueChange, 'FIELD', 'LOCALE', 'VALUE');
    });

    it('sends field value change for each locale', function () {
      var fieldFactory = this.$inject('fieldFactory');
      fieldFactory.getLocaleCodes = sinon.stub().returns(['LOC A', 'LOC B', 'LOC C']);

      widgetAPI.sendFieldValueChange = sinon.stub();

      this.otDoc.setValueAt(['fields', 'FIELD'], {
        'LOC A': 'VAL A',
        'LOC B': 'VAL B'
      });
      this.otDoc.changes.emit(['fields', 'FIELD']);
      this.$apply();
      sinon.assert.calledWithExactly(widgetAPI.sendFieldValueChange, 'FIELD', 'LOC A', 'VAL A');
      sinon.assert.calledWithExactly(widgetAPI.sendFieldValueChange, 'FIELD', 'LOC B', 'VAL B');
      sinon.assert.calledWithExactly(widgetAPI.sendFieldValueChange, 'FIELD', 'LOC C', undefined);
    });

    it('does not send field value changes if path does not start with "fields"', function () {
      this.otDoc.changes.emit(['NOT fields', 'FIELD']);
      this.$apply();
      sinon.assert.notCalled(widgetAPI.sendFieldValueChange);
    });

    it('ignores unknown fields', function () {
      this.otDoc.changes.emit(['fields', 'UNKNOWN']);
      this.$apply();
      sinon.assert.notCalled(widgetAPI.sendFieldValueChange);
    });
  });

  describe('"setValue" handler', function () {
    beforeEach(function () {
      widgetAPI.buildDocPath = sinon.stub()
        .withArgs('PUBLIC FIELD', 'PUBLIC LOCALE')
        .returns(['internal', 'path']);

      this.otDoc.setValueAt = sinon.stub().resolves();
    });

    it('delegates with path translated path to "otDoc"', function () {
      var handler = widgetAPI.registerHandler.withArgs('setValue').args[0][1];
      handler('PUBLIC FIELD', 'PUBLIC LOCALE', 'VAL');
      sinon.assert.calledWithExactly(this.otDoc.setValueAt, ['internal', 'path'], 'VAL');
    });

    it('rejects with API error code when update fails', function () {
      this.otDoc.setValueAt.rejects();
      var handler = widgetAPI.registerHandler.withArgs('setValue').args[0][1];
      var errored = sinon.stub();
      handler('PUBLIC FIELD', 'PUBLIC LOCALE', 'VAL').catch(errored);
      this.$apply();
      sinon.assert.calledWithExactly(errored, sinon.match({code: 'ENTRY UPDATE FAILED'}));
    });
  });

  describe('on iframe load', function () {
    it('connects the widget API', function () {
      widgetAPI.connect = sinon.stub();
      const iframe = this.element.find('iframe').get(0);
      iframe.dispatchEvent(new window.Event('load'));
      this.$apply();
      sinon.assert.calledOnce(widgetAPI.connect);
    });
  });
});
