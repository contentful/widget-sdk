'use strict';

angular.module('contentful').factory('selection', ['analytics', function (analytics) {

  return function createSelection () {

    var selectedById = {};
    var selected = [];

    return {
      add:         add,
      remove:      remove,
      toggle:      toggle,
      isSelected:  isSelected,
      updateList:  updateList,
      clear:       function () { selectedById = {}; sync();  },
      size:        function () { return _.size(selected);    },
      isEmpty:     function () { return _.isEmpty(selected); },
      getSelected: function () { return selected;            }
    };

    function add (entity) {
      selectedById[entity.getId()] = entity;
      sync();
      analytics.track('Selected Entity', {entity: entity.getType(), id: entity.getId()});
    }

    function remove (entity) {
      delete selectedById[entity.getId()];
      sync();
      analytics.track('Deselected Entity', {entity: entity.getType(), id: entity.getId()});
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

    function sync () {
      selected = _.values(selectedById);
    }
  };
}]);
