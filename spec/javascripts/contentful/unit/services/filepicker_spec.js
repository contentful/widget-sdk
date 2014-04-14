'use strict';

describe('Filepicker service', function () {

  describe('returns previously defined filepicker object', function () {
    var filepicker;
    var filepickerStub = {provided: 'filepicker'};
    beforeEach(function () {
      module('contentful/test', function ($provide) {
        $provide.value('$window', {
          addEventListener: sinon.stub(),
          filepicker: filepickerStub
        });

      });
      inject(function (_filepicker_) {
        filepicker = _filepicker_;
      });
    });

    afterEach(function () {
      inject(function ($log, $window) {
        delete $window.filepicker;
        $log.assertEmpty();
      });
    });

  });

  describe('returns filepicker object', function () {
    var filepicker, $window;
    var makeDropPaneStub, pickStub, storeStub;
    beforeEach(function () {
      module('contentful/test', function ($provide) {
        $provide.constant('environment', {
          settings: {
            filepicker: {
              policy: 'policy',
              signature: 'signature'
            }
          }
        });
      });
      inject(function (_filepicker_, _$window_) {
        filepicker = _filepicker_;
        $window = _$window_;

        makeDropPaneStub = sinon.stub($window.filepicker, 'makeDropPane');
        pickStub = sinon.stub($window.filepicker, 'pick');
        storeStub = sinon.stub($window.filepicker, 'store');
      });
    });

    afterEach(function () {
      inject(function ($log) {
        makeDropPaneStub.restore();
        pickStub.restore();
        storeStub.restore();
        $log.assertEmpty();
      });
    });

    it('filepicker service exists', function () {
      expect(filepicker).toBeDefined();
    });

    it('filepicker is defined on window', function () {
      expect($window.filepicker).toBeDefined();
    });

    describe('makeDropPane is called', function () {
      var dropPane = {drop: 'pane'};
      beforeEach(function () {
        filepicker.makeDropPane(dropPane, {option: 'droppane', extraoption: 'extra'});
      });

      it('filepicker method gets called', function () {
        expect(makeDropPaneStub).toBeCalled();
      });

      it('filepicker method gets called with dropPane object', function () {
        expect(makeDropPaneStub.args[0][0]).toBe(dropPane);
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

      it('has an extra option', function() {
        expect(makeDropPaneStub.args[0][1].extraoption).toBe('extra');
      });

      it('extra option disappears if called again', function() {
        filepicker.makeDropPane(dropPane, {});
        expect(makeDropPaneStub.args[1][1].extraoption).toBeUndefined();
      });

    });

    describe('pick is called', function () {
      it('returns a file', function () {
        var successStub = sinon.stub();
        var file = {file: 'name'};
        pickStub.callsArgWith(1, file);
        filepicker.pick().then(successStub).finally(function () {
          expect(successStub).toBeCalledWith(file);
        });
      });

      it('returns an error', function () {
        var errorStub = sinon.stub();
        var error = new Error('fileerror');
        pickStub.callsArgWith(2, error);
        filepicker.pick().catch(errorStub).finally(function () {
          expect(errorStub).toBeCalledWith(error);
        });
      });

      it('has no extra option if passed previously', function() {
        filepicker.makeDropPane({}, {extraoption: 'extra'});
        filepicker.pick();
        expect(pickStub.args[0][0].extraoption).toBeUndefined();
      });

    });

    describe('store is called', function() {
      it('returns a file', function () {
        var successStub = sinon.stub();
        var file = {fileName: 'name', mimetype: 'type', details: {size: 'size'}};
        storeStub.callsArgWith(2, file);
        filepicker.store('newurl', file).then(successStub).finally(function () {
          expect(successStub).toBeCalled();
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
        var errorStub = sinon.stub();
        var error = new Error('fileerror');
        storeStub.callsArgWith(3, error);
        filepicker.store('', {details: {}}).catch(errorStub).finally(function () {
          expect(errorStub).toBeCalledWith(error);
        });
      });

      it('has no extra option if passed previously', function() {
        filepicker.makeDropPane({}, {extraoption: 'extra'});
        filepicker.store('', {details: {}});
        expect(storeStub.args[0][1].extraoption).toBeUndefined();
      });


    });

  });
});
