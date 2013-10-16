'use strict';

describe('Entry Actions Controller', function () {
  var controller, scope;

  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope;
    controller = $controller('EntryActionsCtrl', {$scope: scope});
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('when publishing', function () {
    var errors = [ {foo: 'bar'} ];

    beforeEach(function () {
      scope.otDoc = {version: 123};
      scope.spaceContext = {
        entryTitle: sinon.stub()
      };
      scope.validate = sinon.stub().returns(true);
      var error = {
        body: {
          sys: {id: 'ValidationFailed'},
          details: {
            errors: errors
          }
        }
      };
      scope.entry = {
        publish: sinon.stub().yields(error),
        getVersion: sinon.stub().returns(20)
      };
    });
    
    it('should put remote validation errors on the scope', function () {
      scope.setValidationErrors = sinon.stub();
      scope.publish();
      //expect(scope.setValidationResult.args[0][0]).toBe(errors);
      expect(scope.setValidationErrors.calledWith(errors)).toBe(true);
    });
  });

});
