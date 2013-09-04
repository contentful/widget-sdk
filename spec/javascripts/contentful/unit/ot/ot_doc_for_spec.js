'use strict';

describe('otDocFor', function () {
  var elem, scope;

  beforeEach(module('contentful/test'));
  beforeEach(inject(function ($compile, $rootScope) {
    scope = $rootScope;
    $rootScope.otDoc = {
      snapshot: {foo: 'bar'}
    };
    $rootScope.entity = {
      update: sinon.spy()
    };
    elem = $compile('<div ot-doc-for="entity"></div>')($rootScope);
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));


  describe('updating entity', function () {
    it('should update the entity with a copy of the snapshot', function () {
      scope.otUpdateEntity();
      expect(scope.entity.update.calledOnce);
      expect(scope.entity.update.args[0][0]).toLookEqual(scope.otDoc.snapshot);
      expect(scope.entity.update.args[0][0]).not.toBe(scope.otDoc.snapshot);
    });
  });
});
