'use strict';

describe('cfVideoInput Controller', function () {
  let assetLookupDeferred, attrs, controller;
  let modalDialogStub, modalDialogDeferred, scope;

  beforeEach(function () {
    module('contentful/test');
    module(function ($provide) {
      modalDialogStub = jasmine.createSpyObj('modalDialogStub', ['open']);
      $provide.value('modalDialog', modalDialogStub);
    });

    inject(function ($rootScope, $controller, $q, modalDialog) {
      scope = $rootScope.$new();
      scope.onSelectionSpy = jasmine.createSpy();
      attrs = {
        value: 'fieldValue',
        onReset: jasmine.createSpy(),
        onChange: jasmine.createSpy(),
        onValidAssetId: jasmine.createSpy(),
        onInvalidAssetId: jasmine.createSpy(),
        assetLookup: jasmine.createSpy(),
        searchConfig: '{scope: {}, template: "template", onSelection: onSelectionSpy}'
      };

      assetLookupDeferred = $q.defer();
      modalDialogDeferred = $q.defer();
      attrs.assetLookup.and.returnValue(assetLookupDeferred.promise);
      modalDialog.open.and.returnValue({promise: modalDialogDeferred.promise});

      controller = $controller('cfVideoInputController', {$scope: scope, $attrs: attrs});
      scope.$apply();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('#clearField', function () {
    it('resets the assetId value', function () {
      scope.videoInput.assetId = 123;
      controller.clearField();

      expect(scope.videoInput.assetId).toBeUndefined();
    });
  });

  describe('#resetField', function () {
    beforeEach(function () {
      spyOn(controller, 'clearField');
      controller.resetField();
    });

    it('calls #clearField', function () {
      expect(controller.clearField).toHaveBeenCalled();
    });

    it('calls the callback on attrs.onReset', function () {
      expect(attrs.onReset).toHaveBeenCalled();
    });
  });

  describe('#launchSearchDialog', function () {
    beforeEach(function () {
      controller.launchSearchDialog();
    });

    it('opens a modal dialog', function () {
      expect(modalDialogStub.open).toHaveBeenCalled();
    });

    describe('modal dialog params', function () {
      let args;
      beforeEach(function () {
        args = modalDialogStub.open.calls.mostRecent().args[0];
      });

      it('uses the searchConfig.scope as the scope param', function () {
        expect(scope.videoInput.searchConfig.scope).toEqual(args.scope);
      });

      it('uses the searchConfig.template as the template param', function () {
        expect(scope.videoInput.searchConfig.template).toEqual(args.template);
      });
    });

    describe('when some elements are selected on the modal dialog', function () {
      let args;
      beforeEach(function () {
        modalDialogDeferred.resolve('selection');
        scope.$apply();

        args = scope.videoInput.searchConfig.onSelection.calls.mostRecent().args;
      });

      it('calls the callback onSelection', function () {
        expect(scope.videoInput.searchConfig.onSelection).toHaveBeenCalled();
      });

      it('passes the selected elements to the callback', function () {
        expect(args[0]).toEqual('selection');
      });
    });
  });

  describe('on "value" attr change', function () {
    beforeEach(function () {
      scope[attrs.value] = 'value-changed';
      scope.$apply();
    });

    it('updates the input value', function () {
      expect(scope.videoInput.assetId).toEqual('value-changed');
    });
  });

  describe('on input value change', function () {
    it('calls the onChange callback', function () {
      scope.videoInput.assetId = 'value';
      scope.$apply();

      expect(attrs.onChange).toHaveBeenCalled();
    });

    describe('when the input field is empty', function () {
      beforeEach(function () {
        scope.videoInput.assetId = '';
      });

      it('clears the loading flag', function () {
        expect(scope.videoInput.isLoading).toBeFalsy();
      });

      it('calls onReset callback', function () {
        expect(attrs.onReset).toHaveBeenCalled();
      });
    });

    describe('when the input field is not empty', function () {
      beforeEach(function () {
        scope.videoInput.assetId = 'value';
        scope.$apply();
      });

      it('calls the assetLookup callback', function () {
        expect(attrs.assetLookup).toHaveBeenCalled();
      });

      describe('on successful lookup', function () {
        beforeEach(function () {
          assetLookupDeferred.resolve({});
          scope.$apply();
        });

        it('callls the onValidAssetId callback', function () {
          expect(attrs.onValidAssetId).toHaveBeenCalled();
        });

        it('clears the loading flag', function () {
          expect(scope.videoInput.isLoading).toBeFalsy();
        });
      });

      describe('on failed lookup', function () {
        beforeEach(function () {
          assetLookupDeferred.reject({});
          scope.$apply();
        });

        it('calls the onInvalidAssetId', function () {
          expect(attrs.onInvalidAssetId).toHaveBeenCalled();
        });

        it('clears the loading flag', function () {
          expect(scope.videoInput.isLoading).toBeFalsy();
        });
      });
    });
  });
});
