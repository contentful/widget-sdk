import * as K from 'utils/kefir.es6';

export function create() {
  let focusedField = null;
  const focusedFieldBus = K.createPropertyBus(null);

  /**
   * @ngdoc type
   * @name entityEditor/Focus
   * @description
   * A bus to communicate which field in an entry is focused
   */
  return {
    /**
     * @ngdoc property
     * @name entityEditor/Focus#field$
     * @type {Property<string?>}
     */
    field$: focusedFieldBus.property,

    /**
     * @ngdoc method
     * @name entityEditor/Focus#set
     * @param {string} id
     */
    set: function(id) {
      focusedField = id;
      focusedFieldBus.set(id);
    },

    /**
     * @ngdoc method
     * @name entityEditor/Focus#unset
     * @param {string} id
     */
    unset: function(id) {
      if (focusedField === id) {
        focusedFieldBus.set(null);
      }
    }
  };
}
