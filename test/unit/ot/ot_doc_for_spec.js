'use strict';

describe('otDocFor', function () {
  var elem, scope;

  beforeEach(function() {
    module('contentful/test');
    inject(function ($compile, $rootScope) {
      scope = $rootScope;
      $rootScope.otDoc = {
        snapshot: {foo: 'bar', baz: {}, sys: {version: 100, updatedAt: 'foo'}},
        version: 123
      };
      $rootScope.entity = {
        update: sinon.stub()
      };
      elem = $compile('<div ot-doc-for="entity"></div>')($rootScope);
    });
  });

  describe('updating entity', function () {
    it('should update the entity with a copy of the snapshot', function () {
      scope.otUpdateEntity();
      sinon.assert.calledOnce(scope.entity.update);
      var data = scope.entity.update.args[0][0];
      expect(data).not.toBe(scope.otDoc.snapshot);
      expect(_.omit(data, 'sys')).toLookEqual(_.omit(scope.otDoc.snapshot, 'sys'));
    });

    it('should preserve version and updatedAt', function () {
      /*global moment*/
      var clock = sinon.useFakeTimers('Date');
      try {
        scope.otUpdateEntity();
        var iso = moment().toISOString();
        var data = scope.entity.update.args[0][0];
        expect(data.sys.version).toBe(123);
        expect(data.sys.updatedAt).toBe(iso);
      } finally {
        clock.restore();
      }
    });
  });

  describe('opening a ShareJS document', function () {
    beforeEach(inject(function (){
      scope.otDoc = null;
      scope.otDisabled = false;
      scope.otConnected = true;
      scope.entity.data = {ding: 'dong', sys: {id: 'deadbeef', version: 1}};
    }));

    it('should immediately update the entity', function (done) {
      spyOn(scope, 'otUpdateEntity');
      scope.$watch('!!otDoc', function (hasDoc) {
        if (hasDoc) {
          expect(scope.otUpdateEntity).toHaveBeenCalled();
          done();
        }
      });
      scope.$digest();
    });

    it('should not immediately update the entity if the id is missing', function (done) {
      delete scope.entity.data.sys.id;
      spyOn(scope, 'otUpdateEntity');
      scope.$watch('!!otDoc', function (hasDoc) {
        if (hasDoc) {
          expect(scope.otUpdateEntity).not.toHaveBeenCalled();
          done();
        }
      });
      scope.$digest();
    });
  });
});
