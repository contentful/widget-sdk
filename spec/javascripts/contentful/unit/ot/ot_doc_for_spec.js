'use strict';

describe('otDocFor', function () {
  var elem, scope;

  beforeEach(module('contentful/test'));
  beforeEach(inject(function ($compile, $rootScope) {
    scope = $rootScope;
    $rootScope.otDoc = {
      snapshot: {foo: 'bar', baz: {}, sys: {version: 100, updatedAt: 'foo'}},
      version: 123
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
      var data = scope.entity.update.args[0][0];
      expect(data).not.toBe(scope.otDoc.snapshot);
      expect(_.omit(data, 'sys')).toLookEqual(_.omit(scope.otDoc.snapshot, 'sys'));
    });

    it('should preserve version and updatedAt', function () {
      /*global moment*/
      scope.otUpdateEntity();
      var iso = moment().toISOString();
      var data = scope.entity.update.args[0][0];
      expect(data.sys.version).toBe(123);
      expect(data.sys.updatedAt).toBe(iso);
    });
  });

  describe('opening a ShareJS document', function () {
    beforeEach(inject(function (){
      scope.otDoc = null;
      scope.otDisabled = false;
      scope.otConnected = true;
      scope.entity.data = {ding: 'dong', sys: {id: 'deadbeef', version: 1}};
    }));

    it('should immediately update the entity', function () {
      this.async(function (done) {
        spyOn(scope, 'otUpdateEntity');
        scope.$watch('!!otDoc', function (hasDoc) {
          if (hasDoc) {
            expect(scope.otUpdateEntity).toHaveBeenCalled();
            done();
          }
        });
        scope.$digest();
      });
    });

    it('should not immediately update the entity if the id is missing', function () {
      delete scope.entity.data.sys.id;
      this.async(function (done) {
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
});
