angular.module('contentful/classes').factory('Selection', function(){
  'use strict';
  
  function Selection() {
    this.mode = Selection.INDIVIDUAL;
    this.entities = {};
  }

  Selection.INDIVIDUAL = 'mode_individual';
  Selection.ALL = 'mode_all';

  Selection.prototype = {
    selectAll: function() {
      this.mode = Selection.ALL;
      this.entities = {};
    },

    deselectAll: function() {
      this.mode = Selection.INDIVIDUAL;
      this.entities = {};
    },

    _add: function(entity) {
      this.entities[entity.getId()] = entity;
    },

    _remove: function(entity) {
      delete this.entities[entity.getId()];
    },

    add: function(entity) {
      if (this.mode == Selection.INDIVIDUAL) {
        this._add(entity);
      } else {
        this._remove(entity);
      }
    },

    remove: function(entity) {
      if (this.mode == Selection.INDIVIDUAL) {
        this._remove(entity);
      } else {
        this._add(entity);
      }
    },

    isSelected: function(entity) {
      if (this.mode == Selection.INDIVIDUAL) {
        return !!this.entities[entity.getId()];
      } else {
        return !this.entities[entity.getId()];
      }
    },

    setBaseSize: function(size) {
      this.baseSize = size;
    },

    switchBaseSet: function(size) {
      this.deselectAll();
      this.setBaseSize(size);
    },

    size: function() {
      if (this.mode == Selection.ALL) {
        return this.baseSize - _.size(this.entities);
      } else {
        return _.size(this.entities);
      }
    },

    isEmpty: function() {
      if (this.mode == Selection.ALL) {
        return false;
      } else {
        return _.size(this.entities) <= 0;
      }
    },

    getSelected: function(baseSet) {
      if (this.mode == Selection.ALL) {
        // TODO getSelected doesn't really make sense for ALL selection
        // Calls on the selected Items should not be made on members of
        // the selection anyways but the selection should be used to
        // generate URLs for mass-API calls
        var self = this;
        return _.filter(baseSet, function (entity) { return !self.entities[entity.getId()]; });
      } else {
        return _.values(this.entities);
      }
    }
  };

  return Selection;
});
