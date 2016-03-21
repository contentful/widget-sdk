'use strict';

describe('cfIframeWidget directive', function () {
  var widgetAPI;
  var OtDoc;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.value('widgets/API', function () {
        return widgetAPI;
      });
    });

    OtDoc = this.$inject('mocks/OtDoc');

    var Widgets = this.$inject('widgets');
    Widgets.get = sinon.stub().returns({});

    widgetAPI = {
      registerHandler: sinon.stub(),
      send: sinon.stub()
    };

    this.scope = this.$compile('<cf-iframe-widget>', {
      widget: {},
      entry: {},
      contentType: {data: {
        fields: [{id: 'FIELD'}]
      }}
    }).scope();
  });

  describe('"otChange" event handler', function () {
    it('sends localized field value change', function () {
      widgetAPI.sendFieldValueChange = sinon.stub();
      var doc = new OtDoc({fields: {'FIELD': {'LOCALE': 'VALUE'}}});
      this.scope.$broadcast('otChange', doc, [{p: ['fields', 'FIELD', 'LOCALE']}]);
      sinon.assert.calledWithExactly(widgetAPI.sendFieldValueChange, 'FIELD', 'LOCALE', 'VALUE');
    });

    it('sends field value change for each locale', function () {
      var fieldFactory = this.$inject('fieldFactory');
      fieldFactory.getLocaleCodes = sinon.stub().returns(['LOC A', 'LOC B', 'LOC C']);

      widgetAPI.sendFieldValueChange = sinon.stub();

      var doc = new OtDoc({fields: {
        'FIELD': {
          'LOC A': 'VAL A',
          'LOC B': 'VAL B',
        }
      }});

      this.scope.$broadcast('otChange', doc, [{p: ['fields', 'FIELD']}]);
      sinon.assert.calledWithExactly(widgetAPI.sendFieldValueChange, 'FIELD', 'LOC A', 'VAL A');
      sinon.assert.calledWithExactly(widgetAPI.sendFieldValueChange, 'FIELD', 'LOC B', 'VAL B');
      sinon.assert.calledWithExactly(widgetAPI.sendFieldValueChange, 'FIELD', 'LOC C', undefined);
    });

    it('does not send field value changes if path does not start with "fields"', function () {
      widgetAPI.sendFieldValueChange = sinon.stub();
      var doc = {getAt: sinon.stub()};
      this.scope.$broadcast('otChange', doc, [{p: ['NOT fields']}]);
      sinon.assert.notCalled(widgetAPI.sendFieldValueChange);
    });
  });

  describe('"setValue" handler', function () {
    beforeEach(function () {
      widgetAPI.buildDocPath = sinon.stub();

      widgetAPI.buildDocPath
      .withArgs('PUBLIC FIELD', 'PUBLIC LOCALE')
      .returns(['docpath']);

      this.setValue = function (value) {
        var handler = widgetAPI.registerHandler.withArgs('setValue').args[0][1];
        return handler('PUBLIC FIELD', 'PUBLIC LOCALE', value);
      };

      this.scope.otDoc = {
        doc: new OtDoc(),
      };
    });

    describe('to set a value with `value !== undefined`', function () {
      it('updates the ot document', function () {
        var snapshot = {docpath: 'OLD'};
        this.scope.otDoc.doc.snapshot = snapshot;

        this.setValue('VALUE');
        expect(snapshot.docpath).toEqual('VALUE');
      });

      pit('resolves promise when value got changed', function () {
        return this.setValue('VALUE');
      });
    });

    describe('to remove a value with `value === undefined', function () {
      beforeEach(function () {
        this.scope.otDoc.doc.removeAt = sinon.spy(function (path, cb) {
          cb();
        });
      });

      it('updates the ot document', function () {
        var snapshot = {docpath: 'OLD'};
        this.scope.otDoc.doc.snapshot = snapshot;

        this.setValue(undefined);
        sinon.assert.calledOnce(this.scope.otDoc.doc.removeAt);
        sinon.assert.calledWith(this.scope.otDoc.doc.removeAt, ['docpath']);
      });

      pit('resolves promise when value got removed', function () {
        return this.setValue(undefined);
      });
    });
  });
});
