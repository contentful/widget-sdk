'use strict';

angular.module('contentful').factory('Selection', ['analytics', function(analytics){

  /**
   * Service for managing which items of a set are selected
   *
   * Differentiates between two modes: INDIVIDUAL and ALL
   *
   * Individual means: All entities in the entities property are selected.
   * All means: The entities in the entities property are NOT selected.
   * The entities property has the ids as keys and the entities as values.
   *
   * To retrieve a working set of selected entities, use the getSelected() method
   * and pass in the baseSet (all entities displayed in a list). The call will
   * return only the entities that are selceted.
   *
   * To allow easy size calculations, use the setBaseSize method
   */
  function Selection() {
    this.mode = Selection.INDIVIDUAL;
    this.entities = {};
  }

  Selection.INDIVIDUAL = 'mode_individual';
  Selection.ALL = 'mode_all';

  Selection.prototype = {
    addAll: function() {
      this.mode = Selection.ALL;
      this.entities = {};
    },

    removeAll: function() {
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
      analytics.track('Selected Entity', {entity: entity.getType(), id: entity.getId() });
    },

    remove: function(entity) {
      if (this.mode == Selection.INDIVIDUAL) {
        this._remove(entity);
      } else {
        this._add(entity);
      }
      analytics.track('Deselected Entity', {entity: entity.getType(), id: entity.getId() });
    },

    toggle: function(entity) {
      if (this.isSelected(entity)) {
        this.remove(entity);
      } else {
        this.add(entity);
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
      this.removeAll();
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
        return _.isEmpty(this.entities);
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
}]);
