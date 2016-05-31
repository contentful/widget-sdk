'use strict';

describe('Extension SDK', function () {
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
    });

    var widgets = this.$inject('widgets');
    widgets.get = sinon.stub().returns({
      srcdoc:
        '<!doctype html>' +
        '<script src="/base/vendor/contentful-widget-sdk/dist/cf-widget-api.js"></script>'
    });

    var spaceContext = this.$inject('spaceContext');
    spaceContext.space = { data: {sys: {}} };

    this.container = $('<div>').appendTo('body');

    var field = {
      id: 'FID-internal',
      apiName: 'FID'
    };


    this.scope = {
      widget: {},
      contentType: {
        data: {
          fields: [field]
        }
      },
      entry: {
        data: {
          sys: {},
          fields: {}
        }
      },
      field: field,
      locale: {
        code: 'de',
        internal_code: 'de-internal'
      },
      otDoc: {
        setValueAt: sinon.stub().resolves(true)
      }
    };


    this.loadApi = () => {
      return new Promise((resolve, reject) => {
        var el = this.$compile('<cf-iframe-widget>', this.scope);
        this.scope = el.scope();
        var iframe = el.find('iframe')[0];
        iframe.removeAttribute('sandbox');
        iframe.addEventListener('load', () => {
          try {
            var w = iframe.contentWindow;
            w.console = window.console;
            w.contentfulWidget.init(resolve);
          } catch (e) {
            reject(e);
          }
        });
        el.appendTo(this.container);
      });
    };
  });

  afterEach(function () {
    this.container.remove();
  });

  var it = makeApiTestDescriptor(window.it);

  describe('#field', function () {


    describe('#getValue()', function () {
      beforeEach(function () {
        this.scope.entry.data.fields['FID-internal'] = {'de-internal': 'INITIAL'};
        dotty.put(this.scope.entry.data, ['fields', 'FID-internal', 'de-internal'], 'INITIAL');
      });

      it('gets initial value', function* (api) {
        expect(api.field.getValue()).toEqual('INITIAL');
      });

      it('gets updated value after otChange event is fired', function* (api, scope) {
        emitOtChange(scope, ['fields', 'FID-internal', 'de-internal'], 'VALUE');
        yield;
        expect(api.field.getValue()).toEqual('VALUE');
      });
    });

    describe('#onValueChanged()', function () {
      it('calls callback after otChange event is fired', function* (api, scope) {
        var valueChanged = sinon.stub();
        api.field.onValueChanged(valueChanged);
        emitOtChange(scope, ['fields', 'FID-internal', 'de-internal'], 'VALUE');
        yield;
        sinon.assert.calledOnce(valueChanged);
        sinon.assert.calledWithExactly(valueChanged, 'VALUE');
      });

      it('does not call callback after detaching', function* (api, scope) {
        var valueChanged = sinon.stub();
        // We make sure that it is called once in order to prevent
        // errors when the event is not dispatched at all.
        api.field.onValueChanged(valueChanged);
        var detach = api.field.onValueChanged(valueChanged);
        detach();
        emitOtChange(scope, ['fields', 'FID-internal', 'de-internal'], 'VALUE');
        yield;
        sinon.assert.calledOnce(valueChanged);
      });
    });


    describe('#setValue()', function () {
      it('calls "otDoc.setValueAt()" with current field path', function* (api, scope) {
        yield api.field.setValue('VAL');
        sinon.assert.calledWith(scope.otDoc.setValueAt, ['fields', 'FID-internal', 'de-internal'], 'VAL');
      });

      it('resolves', function* (api) {
        var success = sinon.stub();
        yield api.field.setValue('VAL').then(success);
        sinon.assert.calledWith(success);
      });

      it('rejects when "otDoc.setValueAt()" fails', function* (api, scope) {
        scope.otDoc.setValueAt.rejects();
        var errored = sinon.stub();
        yield api.field.setValue('VAL').catch(errored);
        sinon.assert.calledWith(errored);
      });
    });
  });


  function emitOtChange (scope, path, value) {
    var doc = {
      getAt: sinon.stub().withArgs(path).returns(value)
    };
    scope.$emit('otChange', doc, [{p: path}]);
  }


  function makeApiTestDescriptor (testFactory) {
    return function defineTest (desc, runner) {
      testFactory(desc, function (done) {
        var $apply = this.$apply.bind(this);
        this.loadApi()
        .then((api) => {
          var gen = runner(api, this.scope);
          return runGenerator(gen, $apply);
        })
        .then(done, done.fail);
      });
    };
  }


  function runGenerator (gen, $apply) {
    return new Promise((resolve, reject) => {
      var next = makeDispatcher('next');
      var throwTo = makeDispatcher('throw');

      next();

      function makeDispatcher (method) {
        return function (val) {
          var ret;
          try {
            ret = gen[method](val);
          } catch (e) {
            reject(e);
            return;
          }

          handleYield(ret);
        };
      }

      function handleYield (ret) {
        if (ret.done) {
          resolve();
          return;
        }

        if (ret.value) {
          ret.value.then(next, throwTo);
        } else {
          $apply();
          setTimeout(function () {
            next(ret.value);
          }, 3);
        }
      }
    });

  }
});
