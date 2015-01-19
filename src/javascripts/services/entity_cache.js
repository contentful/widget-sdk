'use strict';
angular.module('contentful').factory('EntityCache', ['$injector', function($injector){
  var $q         = $injector.get('$q');
  var cfSpinner  = $injector.get('cfSpinner');

  var MAX_IDS_PER_REQUEST = 200;

  function EntityCache(space, fetchMethod) {
    this._space       = space;
    this._fetchMethod = fetchMethod;
    this._cache       = {};
    this._inProgress  = {};
  }

  EntityCache.prototype = {
    save: function(entity){
      if (entity) {
        this._cache[entity.getId()] = entity;
        delete this._inProgress[entity.getId()];
      }
    },

    getAll: function (ids) {
      var self = this;
      var stopSpinner = cfSpinner.start();

      var missingIds = _.reject(ids, this._isKnown, this);
      this._resolveAll(missingIds);

      return $q.all(_.map(ids, function(id){
        return self.get(id) || self._getProgress(id);
      }))
      .finally(stopSpinner);
    },

    get: function (id) {
      return this._cache[id];
    },

    has: function (id) {
      return !!this._cache[id];
    },

    _isKnown: function(id){
      return this.has(id) || this._isInProgress(id);
    },

    _isInProgress: function(id){
      return !!this._inProgress[id];
    },

    _getProgress: function (id) {
      return this._inProgress[id];
    },

    _setProgress: function(id, promise) {
      this._inProgress[id] = promise;
    },

    _resolveBatch: function (ids) {
      return this._space[this._fetchMethod]({
        'sys.id[in]': ids.join(','),
        limit: 1000
      });
    },

    _resolveAll: function (ids) {
      var self = this;
      var batches = split(ids);
      var promise = $q.all(_.map(batches, self._resolveBatch, self))
      .then(function (batches) {
        _.each(batches, function (entities) {
          _.each(entities, self.save, self);
        });
      });
      _.each(ids, function(id){
        self._setProgress(id, promise.then(function(){ return self.get(id); }));
      });
    },
  };

  return EntityCache;

  function split(array) {
    array = _.clone(array);
    var arrays = [];
    while (array.length > 0) {
      arrays.push(array.splice(0, MAX_IDS_PER_REQUEST));
    }
    return arrays;
  }
}]);

