'use strict';
angular.module('contentful').factory('LinkEditorEntityCache', ['$injector', function($injector){
  var $q         = $injector.get('$q');
  var cfSpinner  = $injector.get('cfSpinner');

  var MAX_IDS_PER_REQUEST = 200;
  
  function LinkEditorEntityCache(space, fetchMethod) {
    this._space       = space;
    this._fetchMethod = fetchMethod;
    this._cache       = {};
  }

  LinkEditorEntityCache.prototype = {
    save: function(entity){
      if (entity) this._cache[entity.getId()] = entity;
    },
    getAll: function (ids) {
      var self = this;
      var stopSpinner = cfSpinner.start();
      return this._resolveAll(ids)
      .then(function () {
        return _.map(ids, self._getLocal, self);
      })
      .finally(stopSpinner);
    },
    _getLocal: function (id) {
      return this._cache[id];
    },
    _hasLocally: function (id) {
      return !!this._cache[id];
    },
    _resolveBatch: function (ids) {
      var cb = $q.callback();
      this._space[this._fetchMethod]({
        'sys.id[in]': ids.join(','),
        limit: 1000
      }, cb);
      return cb.promise;
    },
    _resolveAll: function (ids) {
      var self = this;
      var missingIds = _.reject(ids, self._hasLocally, self);
      return $q.all(_.map(split(missingIds), self._resolveBatch, self))
      .then(function (batches) {
        _.each(batches, function (entities) {
          _.each(entities, self.save, self);
        });
      });
    },
  };

  return LinkEditorEntityCache;

  function split(array) {
    var arrays = [];
    while (array.length > 0) {
      arrays.push(array.splice(0, MAX_IDS_PER_REQUEST));
    }
    return arrays;
  }
}]);

