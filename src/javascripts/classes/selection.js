'use strict';

angular.module('contentful')
.factory('selection', [function () {
  return function createSelection () {
    var selectedById = {};
    var selected = [];

    return {
      add: add,
      remove: remove,
      toggle: toggle,
      isSelected: isSelected,
      updateList: updateList,
      clear: clear,
      size: function () { return _.size(selected); },
      isEmpty: function () { return _.isEmpty(selected); },
      getSelected: function () { return selected; }
    };

    function add (entity) {
      selectedById[entity.getId()] = entity;
      sync();
    }

    function remove (entity) {
      delete selectedById[entity.getId()];
      sync();
    }

    function isSelected (entity) {
      return entity.getId() in selectedById;
    }

    function toggle (entity) {
      if (isSelected(entity)) {
        remove(entity);
      } else {
        add(entity);
      }
    }

    function updateList (entities) {
      selectedById = _.transform(entities, function (acc, entity) {
        if (isSelected(entity)) {
          acc[entity.getId()] = entity;
        }
      }, {});

      sync();
    }

    function clear () {
      selectedById = {};
      sync();
    }

    function sync () {
      selected = _.values(selectedById);
    }
  };
}]);
