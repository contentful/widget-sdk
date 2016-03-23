'use strict';

describe('cfWidgetApi directive', function () {
  var scope, widgetApi;

  beforeEach(function () {
    module('contentful/test');

    scope = this.$inject('$rootScope').$new();

    var $controller = this.$inject('$controller');
    var $injector = this.$inject('$injector');

    _.extend(scope, {
      widget: {
        field: {}
      },
      isDisabled: sinon.stub(),
      otSubDoc: {
        changeString: sinon.stub(),
        getValue: sinon.stub()
      },
      locale: {}
    });

    widgetApi = $controller('WidgetApiController', {
      '$scope': scope,
      '$injector': $injector
    });
  });

  afterEach(function () {
    scope.$destroy();
    scope = null;
    widgetApi = null;
  });

  describe('#onValueChanged()', function () {
    it('attaches a handler and returns its detach counterpart', function () {
      var cb = sinon.spy();
      var detachCb = widgetApi.field.onValueChanged(cb);

      scope.$emit('otValueChanged');
      sinon.assert.called(cb);

      detachCb();
      scope.$emit('otValueChanged');
      sinon.assert.calledOnce(cb);
    });

    it('callback given to onValueChanged is called when input value changes', function () {
      var cb = sinon.spy();
      var value = 'test';

      widgetApi.field.onValueChanged(cb);

      scope.$emit('otValueChanged', [], value);
      sinon.assert.calledWithExactly(cb, value);
      sinon.assert.calledOnce(cb);
    });
  });

  describe('#setValue()', function () {
    var doc;

    beforeEach(function () {
      doc = scope.otSubDoc;
      doc.changeValue = sinon.stub().resolves();
    });

    it('calls otSubDoc.changeValue when value is different', function () {
      doc.getValue.returns('OLD');
      widgetApi.field.setValue('NEW');
      sinon.assert.calledOnce(doc.changeValue);
      sinon.assert.calledWithExactly(doc.changeValue, 'NEW');
    });

    it('does not call otSubDoc.changeValue when value is the same', function () {
      doc.getValue.returns('SAME');
      widgetApi.field.setValue('SAME');
      sinon.assert.notCalled(doc.changeValue);
    });

    it('returns a promise', function () {
      var handler = sinon.spy();
      widgetApi.field.setValue('NEW').then(handler);
      this.$apply();
      sinon.assert.calledOnce(handler);
    });
  });

  describe('#setString()', function () {
    it('sets new string value using changeString method on otSubDoc', function () {
      widgetApi.field.setString('test');

      sinon.assert.calledWithExactly(scope.otSubDoc.changeString, 'test');
      sinon.assert.calledOnce(scope.otSubDoc.changeString);
    });

    pit('returns a promise', function () {
      scope.otSubDoc.changeString.resolves('test');

      return widgetApi.field.setString('test')
        .then(function (val) {
          expect(val).toEqual('test');
        });
    });

    pit('should not call changeString if old and new value are the same', function() {
      scope.otSubDoc.getValue.returns('test');

      return widgetApi.field.setString('test')
        .then(function () {
          sinon.assert.notCalled(scope.otSubDoc.changeString);
        });
    });
  });

  describe('#getValue()', function () {
    it('gets value set using setString', function () {
      var value;

      scope.otSubDoc = {
        changeString: function (newVal) {
          value = newVal;
        },
        getValue: function () {
          return value;
        }
      };
      widgetApi.field.setString('test string');
      expect(widgetApi.field.getValue()).toEqual('test string');
    });
  });

  describe('#removeValue()', function () {
    it('delegates call to "otSubDoc"', function () {
      scope.otSubDoc.removeValue = sinon.stub();
      widgetApi.field.removeValue();
      sinon.assert.calledOnce(scope.otSubDoc.removeValue);
    });
  });

  describe('#onDisabledStatusChanged()', function () {
    it('is dispatched with initial value', function () {
      var cb = sinon.spy();
      scope.isDisabled.returns('FOO');
      this.$apply();
      widgetApi.field.onDisabledStatusChanged(cb, true);
      sinon.assert.calledOnce(cb);
      sinon.assert.calledWithExactly(cb, 'FOO');
    });

    it('is dispatched when value changes', function () {
      var cb = sinon.spy();
      scope.isDisabled.returns('FOO');
      this.$apply();
      widgetApi.field.onDisabledStatusChanged(cb);
      sinon.assert.notCalled(cb);

      scope.isDisabled.returns('BAR');
      this.$apply();
      sinon.assert.calledOnce(cb);
      sinon.assert.calledWithExactly(cb, 'BAR');
    });
  });
});
