'use strict';

describe('otDocFor', function () {
  var moment, scope;

  beforeEach(function() {
    module('contentful/test');
    moment = this.$inject('moment');

    this.entity = {
      update: function (data) {
        this.data = data;
      },
      getVersion: function () {
        return this.data.sys.version;
      },
      data: {
        sys: {version: 8}
      }
    };

    scope = this.$compile('<div ot-doc-for="entity">', {
      entity: this.entity,
    }).scope();
  });

  it('otDoc is initially undefined', function(){
    expect(scope.otDoc.doc).toBeUndefined();
  });

  describe('#updateEntityData()', function () {

    beforeEach(function () {
      this.clock = sinon.useFakeTimers(1234, 'Date');
      this.now = moment();
      scope.otDoc.doc = {
        snapshot: {foo: 'bar', baz: {}, sys: {version: 100, updatedAt: 'foo'}},
        version: 123
      };
    });

    afterEach(function () {
      this.clock.restore();
    });

    it('updates the entity data with a copy of the snapshot', function () {
      sinon.spy(this.entity, 'update');
      scope.otDoc.updateEntityData();
      sinon.assert.calledOnce(this.entity.update);
      var data = this.entity.data;
      expect(data).not.toBe(scope.otDoc.doc.snapshot);
      expect(_.omit(data, 'sys')).toLookEqual(_.omit(scope.otDoc.doc.snapshot, 'sys'));
    });

    it('it updates the entity version', function () {
      this.entity.data.sys.version = '';
      scope.otDoc.doc.version = 'NEW VERSION';
      scope.otDoc.updateEntityData();
      expect(this.entity.data.sys.version).toBe('NEW VERSION');
    });

    it('it updates the entity timestamp for new versions', function () {
      this.entity.data.sys.updatedAt = 'UPDATED AT';
      this.entity.data.sys.version = 0;
      scope.otDoc.doc.version = 1;
      scope.otDoc.updateEntityData();
      expect(this.entity.data.sys.updatedAt).toBe(this.now.toISOString());
    });

    it('it does not update the entity timestamp for new versions', function () {
      this.entity.data.sys.updatedAt = 'UPDATED AT';
      this.entity.data.sys.version = 1;
      scope.otDoc.doc.version = 1;
      scope.otDoc.updateEntityData();
      expect(this.entity.data.sys.updatedAt).toBe('UPDATED AT');
    });
  });

  describe('opening a ShareJS document', function () {
    beforeEach(inject(function (){
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
