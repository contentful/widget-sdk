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
    var makeDropPaneStub, pickStub;
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
      });
    });

    afterEach(function () {
      inject(function ($log) {
        makeDropPaneStub.restore();
        pickStub.restore();
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
        filepicker.makeDropPane(dropPane, {option: 'droppane'});
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
    });

    describe('pick is called', function () {
      var $rootScope;
      beforeEach(function () {
        inject(function (_$rootScope_) {
          $rootScope = _$rootScope_;
        });
      });

      it('returns a file', function () {
        var successStub = sinon.stub();
        var file = {file: 'name'};
        pickStub.callsArgWith(1, file);
        filepicker.pick().then(successStub).finally(function () {
          expect(successStub.calledWith(file)).toBeTruthy();
        });
      });

      it('returns an error', function () {
        var errorStub = sinon.stub();
        var error = new Error('fileerror');
        pickStub.callsArgWith(2, error);
        filepicker.pick().catch(errorStub).finally(function () {
          expect(errorStub.calledWith(error)).toBeTruthy();
        });
      });

    });

  });
});
