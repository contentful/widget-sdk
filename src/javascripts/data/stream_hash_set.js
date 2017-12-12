angular.module('cf.data')
/**
 * @ngdoc type
 * @module cf.data
 * @name Data.StreamHashSet
 * @description
 * A data structure that works like a Set and provides access to the
 * items as a property.
 *
 * The `#add(item)` and `#remove(item)` use `item.getId()` to obtain
 * the key that is used to store the item. That key can be used to
 * obtain an item with `#get(key)`.
 *
 * The `#items$` property is a Kefir property with flat lists of
 * items as values. The value is updated when ever one of the mutating
 * functions is called.
 */
.factory('data/StreamHashSet', ['require', function (require) {
  var K = require('utils/kefir');

  return {
    create: create
  };

  function create () {
    var itemsBus = K.createPropertyBus([]);
    var byId = {};

    return {
      items$: itemsBus.property,
      add: add,
      remove: remove,
      reset: reset,
      get: get
    };

    function get (id) {
      return byId[id];
    }

    function reset (newItems) {
      byId = {};
      addMultiple(newItems);
    }

    function add (item) {
      addMultiple([item]);
      return item;
    }

    function remove (item) {
      var id = item.getId();
      if (byId[id] === item) {
        delete byId[id];
        updateItems();
      }
      return item;
    }

    function addMultiple (items) {
      var changed = false;
      items.forEach(function (item) {
        var id = item.getId();
        if (byId[id] !== item) {
          byId[id] = item;
          changed = true;
        }
      });

      if (changed) {
        updateItems();
      }
    }

    function updateItems () {
      var items = _.values(byId);
      itemsBus.set(items);
    }
  }
}]);
