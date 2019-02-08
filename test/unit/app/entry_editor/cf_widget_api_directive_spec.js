import * as K from 'test/helpers/mocks/kefir';
import _ from 'lodash';

describe('cfWidgetApi directive', () => {
  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.constant('spaceContext', {
        cma: {
          getEntry: _.noop,
          getContentType: _.noop,
          getAsset: _.noop
        }
      });
    });

    const $controller = this.$inject('$controller');

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

    const { registerFactory } = this.$inject('NgRegistry.es6');
    registerFactory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);

    this.getWidgetApi = function() {
      _.extend(this.scope, {
        widget: this.widget,
        locale: {},
        fieldLocale: {
          access$: K.createMockProperty({}),
          doc: {
            sys: K.createMockProperty({})
          },
          errors$: K.createMockProperty()
        },
        editorContext: {},
        entityInfo: {
          contentType: {
            fields: []
          }
        },
        state: { registerUnpublishedReferencesWarning: _.noop }
      });

      return $controller('WidgetApiController', {
        $scope: this.scope
      });
    };

    this.widgetApi = this.getWidgetApi();
  });

  describe('#settings', () => {
    describe('helpText', () => {
      it('should equal what has been set for the widget', function() {
        expect(this.widgetApi.settings.helpText).toEqual(this.widget.settings.helpText);
      });

      it('should default to undefined when no help text nor default help text is configured', function() {
        this.widget.settings.helpText = undefined;

        const widgetApi = this.getWidgetApi();

        expect(widgetApi.settings.helpText).toEqual(undefined);
      });
    });
  });

  describe('#entry', () => {
    describe('#getSys()', () => {
      it('returns sys data from entry object', function() {
        this.scope.fieldLocale.doc.sys.set('wat');
        expect(this.widgetApi.entry.getSys()).toEqual('wat');
      });
    });

    describe('#onSysChanged()', () => {
      it('calls callback if "doc.sys" emits changes', function() {
        const cb = sinon.spy();
        this.widgetApi.entry.onSysChanged(cb);
        cb.reset();
        this.scope.fieldLocale.doc.sys.set('new sys');
        sinon.assert.calledWithExactly(cb, 'new sys');
        sinon.assert.calledOnce(cb);
      });
    });
  });

  describe('#space', () => {
    it('exposes same methods as spaceContext.cma', function() {
      const spaceContext = this.$inject('spaceContext');
      const getAllKeys = obj => Object.keys(_.toPlainObject(obj));
      expect(getAllKeys(this.widgetApi.space)).toEqual(getAllKeys(spaceContext.cma));
    });
  });

  describe('#onIsDisabledChanged()', () => {
    it('is dispatched with initial value', function() {
      const cb = sinon.spy();
      this.scope.fieldLocale.access$.set({ disabled: true });
      this.widgetApi.field.onIsDisabledChanged(cb);
      sinon.assert.calledOnce(cb);
      sinon.assert.calledWithExactly(cb, true);
    });

    it('is dispatched when value changes', function() {
      const cb = sinon.spy();
      this.scope.fieldLocale.access$.set({ disabled: true });
      this.widgetApi.field.onIsDisabledChanged(cb);
      cb.reset();

      this.scope.fieldLocale.access$.set({});
      sinon.assert.calledOnce(cb);
      sinon.assert.calledWithExactly(cb, false);
    });
  });

  describe('#onSchemaErrorsChanged()', () => {
    it('emits errors when "fieldLocale.errors" changes', function() {
      const cb = sinon.spy();
      this.widgetApi.field.onSchemaErrorsChanged(cb);
      this.$apply();
      cb.reset();

      this.scope.fieldLocale.errors$.set(['ERRORS']);
      this.$apply();
      sinon.assert.calledOnce(cb);
      sinon.assert.calledWithExactly(cb, ['ERRORS']);
    });
  });

  describe('#field.setInvalid()', () => {
    it('delegates to $scope.fieldController with locale code', function() {
      const setInvalid = sinon.stub();
      this.scope.fieldController = { setInvalid: setInvalid };
      this.scope.locale.code = 'LC';
      this.widgetApi.field.setInvalid('VAL');
      sinon.assert.calledWith(setInvalid, 'LC', 'VAL');
    });
  });
});
