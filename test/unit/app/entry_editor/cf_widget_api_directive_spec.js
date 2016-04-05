'use strict';

describe('cfWidgetApi directive', function () {
  beforeEach(function () {
    var self = this;

    this.getEntries = sinon.stub();

    module('contentful/test', function ($provide) {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
      $provide.value('spaceContext', {
        space: {
          getEntries: self.getEntries
        }
      });
    });

    var $controller = this.$inject('$controller');
    var OtDoc = this.$inject('mocks/OtDoc');

    this.scope = this.$inject('$rootScope').$new();
    this.widget = {
      field: {},
      settings: {
        helpText: 'wat'
      }
    };
    this.entry = {
      data: {
        sys: {}
      }
    };

    this.getWidgetApi = function () {
      _.extend(this.scope, {
        widget: this.widget,
        otSubDoc: {
          changeString: sinon.stub(),
          getValue: sinon.stub(),
          doc: new OtDoc({myfield: {}}, ['myfield'])
        },
        locale: {},
        fieldLocale: {
          access: {}
        },
        entity: this.entry,
        fields: {},
        transformedContentTypeData: {}
      });

      return $controller('WidgetApiController', {
        $scope: this.scope
      });
    };

    this.widgetApi = this.getWidgetApi();
  });

  afterEach(function () {
    this.scope.$destroy();
    this.scope = null;
    this.widget = null;
    this.widgetApi = null;
    this.getWidgetApi = null;
  });

  describe('#settings', function () {
    describe('helpText', function () {
      it('should equal what has been set for the widget', function () {
        expect(this.widgetApi.settings.helpText).toEqual(this.widget.settings.helpText);
      });
      it('should equal default help text if no help text is configured or the widget', function () {
        this.widget.defaultHelpText = 'wat';
        this.widget.settings.helpText = undefined;

        var widgetApi = this.getWidgetApi();

        expect(widgetApi.settings.helpText).toEqual(this.widget.defaultHelpText);
      });
      it('should default to undefined when no help text nor default help text is configured', function () {
        this.widget.settings.helpText = undefined;

        var widgetApi = this.getWidgetApi();

        expect(widgetApi.settings.helpText).toEqual(undefined);
      });
    });
  });

  describe('#entry', function () {
    describe('#getSys()', function () {
      it('returns sys data from entry object', function () {
        this.entry.data.sys = 'wat';
        expect(this.widgetApi.entry.getSys()).toEqual('wat');
      });
    });

    describe('#onSysChanged()', function () {
      it('calls callback if "entry.data.sys" changes', function () {
        var cb = sinon.spy();
        this.widgetApi.entry.onSysChanged(cb);
        cb.reset();
        this.entry.data.sys = 'new sys';
        this.$apply();
        sinon.assert.calledWithExactly(cb, 'new sys');
        sinon.assert.calledOnce(cb);
      });
    });
  });

  // #space
  describe('#getEntries()', function () {
    it('should proxy the call to getEntries defined by spaceContext', function () {
      this.widgetApi.space.getEntries('wat');
      sinon.assert.calledOnce(this.getEntries);
      sinon.assert.calledWithExactly(this.getEntries, 'wat');
    });
  });


  // #field
  describe('#onValueChanged()', function () {
    var path = ['fields', 'fid', 'lid'];

    beforeEach(function () {
      this.cb = sinon.spy();
      this.scope.otPath = path;

      this.testEvent = function (eventName) {
        var detach = this.widgetApi.field.onValueChanged(this.cb);
        this.cb.reset();
        var value = 'test';
        this.scope.$emit(eventName, path, value);
        sinon.assert.calledWithExactly(this.cb, value);
        sinon.assert.calledOnce(this.cb);
        return detach;
      }.bind(this);
    });

    it('attaches a handler and returns its detach counterpart', function () {
      var detachCb = this.testEvent('otValueChanged');
      detachCb();
      this.scope.$emit('otValueChanged', path);
      sinon.assert.calledOnce(this.cb);
    });

    it('callback given to onValueChanged is called when input value changes', function () {
      this.testEvent('otValueChanged');
    });

    it('callback will be called when entry is reverted', function () {
      this.testEvent('otValueReverted');
    });

    it('callback will not be called if OT path does not match', function () {
      var cb = sinon.spy();
      this.widgetApi.field.onValueChanged(cb);
      cb.reset();
      this.scope.$emit('otValueReverted', path);
      this.scope.$emit('otValueReverted', ['fields', 'some-other-field', 'de-DE']);
      sinon.assert.calledOnce(cb);
    });
  });

  describe('#setValue()', function () {
    var doc;

    beforeEach(function () {
      doc = this.scope.otSubDoc;
      doc.changeValue = sinon.stub().resolves();
    });

    it('calls otSubDoc.changeValue when value is different', function () {
      doc.getValue.returns('OLD');
      this.widgetApi.field.setValue('NEW');
      sinon.assert.calledOnce(doc.changeValue);
      sinon.assert.calledWithExactly(doc.changeValue, 'NEW');
    });

    it('does not call otSubDoc.changeValue when value is the same', function () {
      doc.getValue.returns('SAME');
      this.widgetApi.field.setValue('SAME');
      sinon.assert.notCalled(doc.changeValue);
    });

    it('returns a promise', function () {
      var handler = sinon.spy();
      this.widgetApi.field.setValue('NEW').then(handler);
      this.$apply();
      sinon.assert.calledOnce(handler);
    });
  });

  describe('#setString()', function () {
    it('sets new string value using changeString method on otSubDoc', function () {
      this.widgetApi.field.setString('test');

      sinon.assert.calledWithExactly(this.scope.otSubDoc.changeString, 'test');
      sinon.assert.calledOnce(this.scope.otSubDoc.changeString);
    });

    pit('returns a promise', function () {
      this.scope.otSubDoc.changeString.resolves('test');

      return this.widgetApi.field.setString('test')
        .then(function (val) {
          expect(val).toEqual('test');
        });
    });

    pit('should not call changeString if old and new value are the same', function () {
      this.scope.otSubDoc.getValue.returns('test');

      return this.widgetApi.field.setString('test')
        .then(function () {
          sinon.assert.notCalled(this.scope.otSubDoc.changeString);
        }.bind(this));
    });
  });

  describe('#getValue()', function () {
    it('gets value set using setString', function () {
      var value;

      this.scope.otSubDoc = {
        changeString: function (newVal) {
          value = newVal;
        },
        getValue: function () {
          return value;
        }
      };
      this.widgetApi.field.setString('test string');
      expect(this.widgetApi.field.getValue()).toEqual('test string');
    });
  });

  describe('#removeValue()', function () {
    it('delegates call to "otSubDoc"', function () {
      this.scope.otSubDoc.removeValue = sinon.stub();
      this.widgetApi.field.removeValue();
      sinon.assert.calledOnce(this.scope.otSubDoc.removeValue);
    });
  });

  describe('#removeValueAt()', function () {
    it('delegates call to "doc.remove()"', function () {
      var success = sinon.stub();
      this.scope.otSubDoc.doc.set(['A', 'B', 'C']);

      this.widgetApi.field.removeValueAt(1).then(success);
      this.$apply();

      expect(this.scope.otSubDoc.doc.get()).toEqual(['A', 'C']);
      sinon.assert.calledOnce(success);
    });
  });

  describe('#insertValue()', function () {
    it('delegates call to "doc.insert()" if array exists', function () {
      var success = sinon.stub();
      this.scope.otSubDoc.getValue.returns('something');
      this.scope.otSubDoc.doc.set(['A', 'C']);

      this.widgetApi.field.insertValue(1, 'B').then(success);
      this.$apply();

      expect(this.scope.otSubDoc.doc.get()).toEqual(['A', 'B', 'C']);
      sinon.assert.calledOnce(success);
    });

    it('creates new array if value is missing', function () {
      var success = sinon.stub();
      this.scope.otSubDoc.getValue.returns(undefined);
      this.scope.otSubDoc.changeValue = sinon.stub().resolves();

      this.widgetApi.field.insertValue(0, 'A').then(success);
      this.$apply();

      sinon.assert.calledWithExactly(this.scope.otSubDoc.changeValue, ['A']);
      sinon.assert.calledOnce(success);
    });
  });

  describe('#onDisabledStatusChanged()', function () {
    it('is dispatched with initial value', function () {
      var cb = sinon.spy();
      this.scope.fieldLocale.access.disabled = true;
      this.$apply();
      this.widgetApi.field.onDisabledStatusChanged(cb);
      sinon.assert.calledOnce(cb);
      sinon.assert.calledWithExactly(cb, true);
    });

    it('is dispatched when value changes', function () {
      var cb = sinon.spy();
      this.scope.fieldLocale.access.disabled = true;
      this.$apply();
      this.widgetApi.field.onDisabledStatusChanged(cb);
      cb.reset();

      this.scope.fieldLocale.access.disabled = false;
      this.$apply();
      sinon.assert.calledOnce(cb);
      sinon.assert.calledWithExactly(cb, false);
    });
  });
});
