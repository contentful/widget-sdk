import _ from 'lodash';

export function createSelection() {
  let selectedById = {};

  return {
    add,
    remove,
    toggle,
    toggleList,
    isSelected,
    updateList,
    clear,
    size: function () {
      return _.size(selectedById);
    },
    isEmpty: function () {
      return _.isEmpty(selectedById);
    },
    getSelected: function () {
      const values = _.memoize(_.values);

      return values(selectedById);
    },
  };

  function add(entity) {
    selectedById[entity.getId()] = entity;
  }

  function remove(entity) {
    delete selectedById[entity.getId()];
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
  }

  function clear() {
    selectedById = {};
  }
}
