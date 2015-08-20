'use strict';

describe('otDocFor', function () {
  var moment;
  var elem, scope;

  beforeEach(function() {
    module('contentful/test');
    inject(function ($compile, $rootScope, _moment_) {
      moment = _moment_;
      scope = $rootScope;
      $rootScope.entity = {
        update: sinon.stub()
      };
      elem = $compile('<div ot-doc-for="entity"></div>')($rootScope);
      $rootScope.otDoc.doc = {
        snapshot: {foo: 'bar', baz: {}, sys: {version: 100, updatedAt: 'foo'}},
        version: 123
      };
    });
  });

  describe('updating entity', function () {
    it('should update the entity with a copy of the snapshot', function () {
      scope.otDoc.updateEntityData();
      sinon.assert.calledOnce(scope.entity.update);
      var data = scope.entity.update.args[0][0];
      expect(data).not.toBe(scope.otDoc.doc.snapshot);
      expect(_.omit(data, 'sys')).toLookEqual(_.omit(scope.otDoc.doc.snapshot, 'sys'));
    });

    it('should preserve version and updatedAt', function () {
      var clock = sinon.useFakeTimers('Date');
      try {
        scope.otDoc.updateEntityData();
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
      scope.otDoc.doc = null;
      scope.otDoc.state = {
        disabled: false,
        connected: true
      };
      scope.entity.data = {ding: 'dong', sys: {id: 'deadbeef', version: 1}};
      scope.entity.update = sinon.stub();
    }));

    it('should immediately update the entity', function (done) {
      scope.$watch('!!otDoc.doc', function (hasDoc) {
        if (hasDoc) {
          sinon.assert.called(scope.entity.update);
          done();
        }
      });
      scope.$digest();
    });

    it('should not immediately update the entity if the id is missing', function (done) {
      delete scope.entity.data.sys.id;
      scope.$watch('!!otDoc.doc', function (hasDoc) {
        if (hasDoc) {
          sinon.assert.notCalled(scope.entity.update);
          done();
        }
      });
      scope.$digest();
    });
  });
});
