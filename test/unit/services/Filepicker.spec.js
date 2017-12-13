'use strict';

describe('Filepicker', function () {
  let Filepicker;
  let makeDropPaneStub, pickStub, storeStub;
  let $rootScope;

  beforeEach(function () {
    module('contentful/test', function (environment) {
      environment.settings.filepicker = {
        policy: 'policy',
        signature: 'signature'
      };
    });

    const $q = this.$inject('$q');
    const LazyLoader = this.$inject('LazyLoader');
    $rootScope = this.$inject('$rootScope');

    LazyLoader.get = function () {
      return $q.resolve({
        setKey: _.noop,
        makeDropPane: (makeDropPaneStub = sinon.stub()),
        pick: (pickStub = sinon.stub()),
        store: (storeStub = sinon.stub())
      });
    };

    Filepicker = this.$inject('services/Filepicker');

    $rootScope.$apply();
  });

  afterEach(function () {
    Filepicker = makeDropPaneStub = pickStub = storeStub = $rootScope = null;
  });

  it('exists', function () {
    expect(Filepicker).toBeDefined();
  });

  describe('.makeDropPane()', function () {
    const myDropPane = {drop: 'pane'};

    beforeEach(function () {
      this.callMakeDropPane = function (dropPane, opts) {
        Filepicker.makeDropPane(dropPane, opts);
        $rootScope.$apply();
      };

      this.callMakeDropPane(myDropPane, {option: 'droppane', extraoption: 'extra'});
    });

    it('filepicker method gets called', function () {
      sinon.assert.called(makeDropPaneStub);
    });

    it('filepicker method gets called with dropPane object', function () {
      expect(makeDropPaneStub.args[0][0]).toBe(myDropPane);
    });

    it('filepicker method gets called with provided options', function () {
      expect(makeDropPaneStub.args[0][1].option).toBe('droppane');
    });

    it('filepicker method gets called with policy', function () {
      expect(makeDropPaneStub.args[0][1].policy).toBe('policy');
    });

    it('filepicker method gets called with signature', function () {
      expect(makeDropPaneStub.args[0][1].signature).toBe('signature');
    });

    it('has an extra option', function () {
      expect(makeDropPaneStub.args[0][1].extraoption).toBe('extra');
    });

    it('extra option disappears if called again', function () {
      this.callMakeDropPane(myDropPane, {});
      expect(makeDropPaneStub.args[1][1].extraoption).toBeUndefined();
    });
  });

  describe('.pick()', function () {
    it('returns a file', function () {
      const successStub = sinon.stub();
      const file = {file: 'name'};
      pickStub.callsArgWith(1, file);
      Filepicker.pick().then(successStub).finally(function () {
        $rootScope.$apply();
        sinon.assert.calledWith(successStub, file);
      });
    });

    it('returns an error', function () {
      const errorStub = sinon.stub();
      const error = new Error('fileerror');
      pickStub.callsArgWith(2, error);
      Filepicker.pick().catch(errorStub).finally(function () {
        $rootScope.$apply();
        sinon.assert.calledWith(errorStub, error);
      });
    });

    it('has no extra option if passed previously', function () {
      Filepicker.makeDropPane({}, {extraoption: 'extra'});
      Filepicker.pick();
      $rootScope.$apply();
      expect(pickStub.args[0][0].extraoption).toBeUndefined();
    });
  });

  describe('.store()', function () {
    it('returns a file', function () {
      const successStub = sinon.stub();
      const file = {fileName: 'name', mimetype: 'type', details: {size: 'size'}};
      storeStub.callsArgWith(2, file);

      Filepicker.store('newurl', file).then(successStub).finally(function () {
        sinon.assert.called(successStub);
        expect(successStub.args[0][0]).toEqual({
          url: 'newurl',
          filename: 'name',
          mimetype: 'type',
          isWriteable: true,
          size: 'size'
        });
      });
    });

    it('returns an error', function () {
      const errorStub = sinon.stub();
      const error = new Error('fileerror');
      storeStub.callsArgWith(3, error);
      Filepicker.store('', {details: {}}).catch(errorStub).finally(function () {
        sinon.assert.calledWith(errorStub, error);
      });
    });

    it('has no extra option if passed previously', function () {
      Filepicker.makeDropPane({}, {extraoption: 'extra'});
      Filepicker.store('', {details: {}});
      $rootScope.$apply();
      expect(storeStub.args[0][1].extraoption).toBeUndefined();
    });
  });
});
