'use strict';

describe('cfWidgetApi directive', function () {
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
      $provide.value('spaceContext', {
        cma: {}
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


  describe('#space', function () {
    it('exposes spaceContext.cma', function () {
      var spaceContext = this.$inject('spaceContext');
      expect(this.widgetApi.space).toEqual(spaceContext.cma);
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

  describe('#onSchemaErrorsChanged()', function () {
    it('emits errors when "fieldLocale.errors" changes', function () {
      var cb = sinon.spy();
      this.widgetApi.field.onSchemaErrorsChanged(cb);
      cb.reset();

      this.scope.fieldLocale.errors = 'ERRORS';
      this.$apply();
      sinon.assert.calledOnce(cb);
      sinon.assert.calledWithExactly(cb, 'ERRORS');
    });
  });

  describe('#field.setInvalid()', function () {
    it('delegates to $scope.fieldController with locale code', function () {
      var setInvalid = sinon.stub();
      this.scope.fieldController = {setInvalid: setInvalid};
      this.scope.locale.code = 'LC';
      this.widgetApi.field.setInvalid('VAL');
      sinon.assert.calledWith(setInvalid, 'LC', 'VAL');
    });
  });
});
