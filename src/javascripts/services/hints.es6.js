import { registerService } from 'NgRegistry.es6';

export default function register() {
  /**
   * @ngdoc service
   * @name hints
   * @description
   * Stores and retrieves the seen state of hints shown throughout the
   * app. These hints should only be shown once for each user.
   */
  registerService('hints', [
    'TheStore/index.es6',
    ({ getStore }) => {
      const store = getStore();

      return {
        /**
         * @ngdoc method
         * @name hints#shouldShow
         * @param {string} id
         * @description
         * Checks if a given hint id has been shown before.
         */
        shouldShow: function(id) {
          return !store.get('hint-' + id);
        },

        setAsSeen: function(id) {
          return !store.set('hint-' + id, true);
        }
      };
    }
  ]);
}
