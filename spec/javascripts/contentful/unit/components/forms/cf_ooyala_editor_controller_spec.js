'use strict';

describe('cfOoyalaEditorController', function () {
  var scope, elem, input, ooyalaClient, $httpBackend;

  beforeEach(function() {
    module('contentful/test');
    inject(function ($rootScope, $compile, _ooyalaClient_, _$httpBackend_) {
      ooyalaClient = _ooyalaClient_;
      $httpBackend = _$httpBackend_;

      $rootScope.otEditable    = true;
      $rootScope.fieldData     = {value: null};
      $rootScope.otChangeValue = sinon.stub().yields();
      elem  = $compile('<cf-ooyala-editor ng-model="fieldData.value" ot-bind-internal="assetId"></cf-ooyala-editor>')($rootScope);
      input = elem.find('input');
      scope = elem.scope();
      scope.$apply();
    });
  });

  describe('on asset id change', function() {
    describe('when it is invalid', function() {
      it('shows a warning message', function() {
        $httpBackend.when('GET', /\/integrations\/ooyala/).respond(404, '');
        input.val('some-invalid-value');
        input.trigger('input');
        $httpBackend.flush();

        expect(scope.errorMessage).toBeDefined();
      });
    });

  });

});
