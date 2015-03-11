'use strict';

describe('Entity cache', function(){
  var EntityCache, $rootScope, space;
  beforeEach(function () {
    module('contentful/test');
    inject(function ($injector) {
      EntityCache = $injector.get('EntityCache');
      $rootScope = $injector.get('$rootScope');
      space = {
        getEntries: sinon.stub(),
        getAssets: sinon.stub()
      };
    });
  });

  describe('save', function(){
    it('should add an entity to the cache', function(){
      var entityCache = new EntityCache(space, 'getEntries');
      var entity = {getId:_.constant(5)};
      entityCache.save(entity);
      entityCache.getAll([5])
      .then(function (entities) {
        expect(entities[0]).toBe(entity);
      });
      sinon.assert.notCalled(space.getEntries);
      $rootScope.$apply();
    });
  });

  describe('getAll', function(){
    var entityCache, locals, remotes;

    beforeEach(function () {
      entityCache = new EntityCache(space, 'getEntries');
      locals  = makeEntities( 0,10);
      remotes = makeEntities(10,20);
    });

    it('should return entities from the cache and from remote', function () {
      _.each(locals, entityCache.save, entityCache);
      entityCache.getAll([8,9,10,11,12,13])
      .then(function (entities) {
        expect(entities[0].getId()).toBe( 8);
        expect(entities[1].getId()).toBe( 9);
        expect(entities[2].getId()).toBe(10);
        expect(entities[3].getId()).toBe(11);
        expect(entities[4].getId()).toBe(11);
        expect(entities[5].getId()).toBe(12);
      });
      space.getEntries.returns(_.first(remotes, 4));
    });

    it('should make a call to the space', function () {
      entityCache.getAll([2,4,6,8]);
      expect(space.getEntries.args[0][0]).toEqual({
        'sys.id[in]': '2,4,6,8',
        limit: 1000
      });
    });

    it('should request the entities in batches', function () {
      entityCache.getAll(_.range(0,300))
      .then(function (entities) {
        expect(entities.length).toBe(300);
      });
      space.getEntries.returns(makeEntities(  0, 200));
      space.getEntries.returns(makeEntities(200, 300));
      expect(space.getEntries.calledTwice).toBe(true);
    });
  });

  describe('get', function() {
    it('should get an entity from the cache', function(){
      var entityCache = new EntityCache(space, 'getEntries');
      var entity = {getId:_.constant(5)};
      entityCache.save(entity);
      expect(entityCache.get(5)).toBe(entity);
      sinon.assert.notCalled(space.getEntries);
      $rootScope.$apply();
    });

    it('should not get an entity from the cache', function(){
      var entityCache = new EntityCache(space, 'getEntries');
      var entity = {getId:_.constant(5)};
      expect(entityCache.get(5)).not.toBe(entity);
      sinon.assert.notCalled(space.getEntries);
      $rootScope.$apply();
    });
  });

  describe('has', function() {
    it('should check if an entity is in the cache', function(){
      var entityCache = new EntityCache(space, 'getEntries');
      var entity = {getId:_.constant(5)};
      entityCache.save(entity);
      expect(entityCache.has(5)).toBe(true);
      sinon.assert.notCalled(space.getEntries);
      $rootScope.$apply();
    });

    it('should not check if an entity is not in cache', function(){
      var entityCache = new EntityCache(space, 'getEntries');
      expect(entityCache.has(5)).toBe(false);
      sinon.assert.notCalled(space.getEntries);
      $rootScope.$apply();
    });
  });

  function makeEntities(min, max) {
    var entities = new Array(max-min);
    for(var i = min; i < max; i++) {
      entities[i] = new Entity(i);
    }
    function Entity(id) {
      this.id = id;
    }
    Entity.prototype.getId = function() { return this.id; };
    return entities;
  }

});

