'use strict';

describe('LinkEditor entity cache', function(){
  var LinkEditorEntityCache, $rootScope, space;
  beforeEach(function () {
    module('contentful/test');
    inject(function ($injector) {
      LinkEditorEntityCache = $injector.get('LinkEditorEntityCache');
      $rootScope = $injector.get('$rootScope');
      space = {
        getEntries: sinon.stub(),
        getAssets: sinon.stub()
      };
    });
  });

  describe('save', function(){
    it('should add an entity to the cache', function(){
      var entityCache = new LinkEditorEntityCache(space, 'getEntries');
      var entity = {getId:_.constant(5)};
      entityCache.save(entity);
      entityCache.getAll([5])
      .then(function (entities) {
        expect(entities[0]).toBe(entity);
      });
      expect(space.getEntries).not.toBeCalled();
      $rootScope.$apply();
    });
  });
  
  describe('getAll', function(){
    var entityCache, locals, remotes;

    beforeEach(function () {
      entityCache = new LinkEditorEntityCache(space, 'getEntries');
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
      space.getEntries.yield(null, _.first(remotes, 4));
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
      space.getEntries.yield(null, makeEntities(  0, 200));
      space.getEntries.yield(null, makeEntities(200, 300));
      expect(space.getEntries.calledTwice).toBe(true);
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

