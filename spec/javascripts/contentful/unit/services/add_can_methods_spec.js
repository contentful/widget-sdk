'use strict';

describe('Add can methods service', function () {
  var canStub;
  var scope;

  beforeEach(function () {
    canStub = sinon.stub();
    module('contentful/test');
    inject(function ($rootScope, addCanMethods) {
      scope = $rootScope.$new();
      scope.can = canStub;
      addCanMethods(scope, 'entity');
      scope.entity = {};
      scope.$digest();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('can create an entity', function () {
    canStub.withArgs('create', 'Entity').returns(true);
    expect(scope.canDuplicate()).toBe(true);
  });

  describe('on undeleted entities', function () {
    beforeEach(function () {
      scope.entity.data = {};
    });
    afterEach(function () {
      delete scope.entity.data;
    });

    it('can delete an entity', function () {
      canStub.withArgs('delete', scope.entity.data).returns(true);
      scope.entity.canDelete = sinon.stub().returns(true);
      expect(scope.canDelete()).toBe(true);
    });

    it('can archive an entity', function () {
      canStub.withArgs('archive', scope.entity.data).returns(true);
      scope.entity.canArchive = sinon.stub().returns(true);
      expect(scope.canArchive()).toBe(true);
    });

    it('can unarchive an entity', function () {
      canStub.withArgs('unarchive', scope.entity.data).returns(true);
      scope.entity.canUnarchive= sinon.stub().returns(true);
      expect(scope.canUnarchive()).toBe(true);
    });

    it('can unpublish an entity', function () {
      canStub.withArgs('unpublish', scope.entity.data).returns(true);
      scope.entity.canUnpublish = sinon.stub().returns(true);
      expect(scope.canUnpublish()).toBe(true);
    });

    it('can publish an entity', function () {
      canStub.withArgs('publish', scope.entity.data).returns(true);
      scope.entity.canPublish = sinon.stub().returns(true);
      expect(scope.canPublish()).toBe(true);
    });
  });

  describe('on deleted entities', function () {
    beforeEach(function () {
      delete scope.entity.data;
    });

    it('cannot delete an entity', function () {
      canStub.withArgs('delete', undefined).returns(undefined);
      scope.entity.canDelete = sinon.stub().returns(false);
      expect(scope.canDelete()).toBe(false);
    });

    it('cannot archive an entity', function () {
      canStub.withArgs('archive', undefined).returns(undefined);
      scope.entity.canArchive = sinon.stub().returns(false);
      expect(scope.canArchive()).toBe(false);
    });

    it('cannot unarchive an entity', function () {
      canStub.withArgs('unarchive', undefined).returns(undefined);
      scope.entity.canUnarchive= sinon.stub().returns(false);
      expect(scope.canUnarchive()).toBe(false);
    });

    it('cannot unpublish an entity', function () {
      canStub.withArgs('unpublish', undefined).returns(undefined);
      scope.entity.canUnpublish = sinon.stub().returns(false);
      expect(scope.canUnpublish()).toBe(false);
    });

    it('cannot publish an entity', function () {
      canStub.withArgs('publish', undefined).returns(undefined);
      scope.entity.canPublish = sinon.stub().returns(false);
      expect(scope.canPublish()).toBe(false);
    });

  });

  it('overrides an existing can method', inject(function ($rootScope, addCanMethods) {
    var deleteStub = sinon.stub();
    scope = $rootScope.$new();
    addCanMethods(scope, 'entity2', {canDelete: deleteStub});
    scope.entity2 = {};
    scope.$digest();
    scope.canDelete();
    expect(deleteStub).toBeCalled();
  }));

});
