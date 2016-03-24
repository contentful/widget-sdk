'use strict';

describe('cfWidgetApi directive', function () {
  beforeEach(function () {
    module('contentful/test');

    var $controller = this.$inject('$controller');
    var $injector   = this.$inject('$injector');

    this.scope = this.$inject('$rootScope').$new();
    this.widget = {
      field: {},
      settings: {
        helpText: 'wat'
      }
    };

    this.getWidgetApi = function () {
      _.extend(this.scope, {
        widget: this.widget,
        isDisabled: sinon.stub(),
        otSubDoc: {
          changeString: sinon.stub(),
          getValue: sinon.stub()
        },
        locale: {}
      });
      return $controller('WidgetApiController', {
        '$scope': this.scope,
        '$injector': $injector
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


  describe('#onValueChanged()', function () {
    it('attaches a handler and returns its detach counterpart', function () {
      var cb = sinon.spy();
      var detachCb = this.widgetApi.field.onValueChanged(cb);

      this.scope.$emit('otValueChanged');
      sinon.assert.called(cb);

      detachCb();
      this.scope.$emit('otValueChanged');
      sinon.assert.calledOnce(cb);
    });

    it('callback given to onValueChanged is called when input value changes', function () {
      var cb = sinon.spy();
      var value = 'test';

      this.widgetApi.field.onValueChanged(cb);

      this.scope.$emit('otValueChanged', [], value);
      sinon.assert.calledWithExactly(cb, value);
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

    pit('should not call changeString if old and new value are the same', function() {
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

  describe('#onDisabledStatusChanged()', function () {
    it('is dispatched with initial value', function () {
      var cb = sinon.spy();
      this.scope.isDisabled.returns('FOO');
      this.$apply();
      this.widgetApi.field.onDisabledStatusChanged(cb, true);
      sinon.assert.calledOnce(cb);
      sinon.assert.calledWithExactly(cb, 'FOO');
    });

    it('is dispatched when value changes', function () {
      var cb = sinon.spy();
      this.scope.isDisabled.returns('FOO');
      this.$apply();
      this.widgetApi.field.onDisabledStatusChanged(cb);
      sinon.assert.notCalled(cb);

      this.scope.isDisabled.returns('BAR');
      this.$apply();
      sinon.assert.calledOnce(cb);
      sinon.assert.calledWithExactly(cb, 'BAR');
    });
  });
});
