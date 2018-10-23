import _ from 'lodash';

export function createSelection() {
  let selectedById = {};
  let selected = [];

  return {
    add: add,
    remove: remove,
    toggle: toggle,
    toggleList: toggleList,
    isSelected: isSelected,
    updateList: updateList,
    clear: clear,
    size: function() {
      return _.size(selected);
    },
    isEmpty: function() {
      return _.isEmpty(selected);
    },
    getSelected: function() {
      return selected;
    }
  };

  function add(entity) {
    selectedById[entity.getId()] = entity;
    sync();
  }

  function remove(entity) {
    delete selectedById[entity.getId()];
    sync();
  }

  function isSelected(entity) {
    return entity.getId() in selectedById;
  }

  function toggle(entity, $event) {
    if (isSelected(entity)) {
      remove(entity);
    } else {
      add(entity);
    }
    if ($event) {
      $event.stopPropagation();
    }
  }

  // entities should always be an Array
  function toggleList(entities, $event) {
    // currentTarget.checked will have the current value before the
    // browser can toggle it.
    // Hence when checked is true, it means the user is going from
    // checked -> unchecked.
    // Therefore, the counterintuitive add and remove assignments
    const action = $event.currentTarget.checked ? add : remove;

    entities.forEach(action);
    $event.stopPropagation();
  }

  function updateList(entities) {
    selectedById = _.transform(
      entities,
      (acc, entity) => {
        if (isSelected(entity)) {
          acc[entity.getId()] = entity;
        }
      },
      {}
    );

    sync();
  }

  function clear() {
    selectedById = {};
    sync();
  }

  function sync() {
    selected = _.values(selectedById);
  }
}
