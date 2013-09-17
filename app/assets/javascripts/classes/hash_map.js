'use strict';

angular.module('contentful').factory('HashMap', function () {

  // Uses object identity to resolve identical object to the same string identifier
  // without tampering with the object itself. Because ng-repeat does not support
  // tracking by object identity

  function HashMap(){
    this._map = [];
  }

  HashMap.prototype.findHashFor = function(object) {
    var mapEntry = _(this._map).find(function (mapEntry) {
      return mapEntry[0] === object;
    });
    return _.result(mapEntry, 1);
  };

  HashMap.prototype.storeHashFor = function(object) {
    var hash = '$hash$' + Math.random().toString();
    this._map.push([object, hash]);
    return hash;
  };

  HashMap.prototype.hashFor = function(object) {
    var existingHash = this.findHashFor(object);
    if (existingHash) {
      return existingHash;
    } else {
      return this.storeHashFor(object);
    }
  };

  HashMap.prototype.remove = function (object) {
    var index = _.findIndex(this._map, function (mapEntry) {
      return mapEntry[0] === object;
    });
    if (0 <= index) this._map.splice(index, 1);
  };

  HashMap.prototype.clear = function() {
    this._map = [];
  };

  return HashMap;

});
