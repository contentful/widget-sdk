import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import * as K from 'utils/kefir.es6';

export default function register() {
  /**
   * @ngdoc type
   * @name PresenceHub
   * @usage[js]
   * const PresenceHub = require('entityEditor/Document/PresenceHub')
   * const presence = PresenceHub.create(userId, docEvents, shout)
   */
  registerFactory('entityEditor/Document/PresenceHub', [
    '$interval',
    $interval => {
      const FOCUS_THROTTLE = 10e3;
      const PING_TIMEOUT = 60e3;

      return {
        create: createPresenceHub
      };

      /**
       * @param {string} ownUserId
       * @param {Stream<Doc.Event> docEvents
       *   Stream of events emitted on the ShareJS document. See
       *   `app/entity_editor/document.js` for details.
       * @param {function} shout
       *   Call this function to send a shout message to the ShareJS
       *   document.
       * @returns {PresenceHub}
       */
      function createPresenceHub(ownUserId, docEvents, shout) {
        /**
         * Maps user IDs to objects with two properties.
         * - `focus` has the internal field id the other user is focusing
         * - `shoutedAt` has the `Date` corresponding to the most recent
         *   shout.
         */
        let presence = {};

        let ownFocusedPath = null;

        const shoutFieldFocus = _.throttle(path => {
          shout(['focus', ownUserId, path]);
        }, FOCUS_THROTTLE);

        // Repeatedly checks if users have not pinged in a while and removes
        // them from presence map.
        const userTimeoutInterval = $interval(removeTimedOutUsers, PING_TIMEOUT);

        const fieldCollaboratorsBus = K.createPropertyBus({});
        const collaboratorsBus = K.createPropertyBus([]);

        docEvents.onValue(event => {
          if (event.name === 'shout') {
            receiveShout(event.data);
          } else if (event.name === 'open') {
            shout(['open', ownUserId]);
          }
        });

        return {
          focus: focus,

          /**
           * @ngdoc property
           * @name PresenceHub#collaborators
           * @description
           * Stream of users currently collaborating on this document.
           *
           * @type {Property<API.User[]}
           */
          collaborators: collaboratorsBus.property,
          collaboratorsFor: collaboratorsFor,

          leave: leave,
          destroy: destroy
        };

        /**
         * @ngdoc method
         * @name PresenceHub#destroy
         * @description
         * Ends all the exposed streams and cleans up timeouts
         */
        function destroy() {
          $interval.cancel(userTimeoutInterval);
          fieldCollaboratorsBus.end();
          collaboratorsBus.end();
        }

        /**
         * @ngdoc method
         * @name PresenceHub#collaboratorsFor
         * @description
         * For a given field ID and locale return a stream of users that
         * are focusing this field.
         *
         * @param {string} fieldId  Internal field id
         * @param {string} localeCode  Internal locale code
         * @returns {Property<API.User[]}
         */
        function collaboratorsFor(fieldId, localeCode) {
          const path = ['fields', fieldId, localeCode].join('.');
          return fieldCollaboratorsBus.property.map(fields => fields[path]);
        }

        /**
         * @ngdoc method
         * @name PresenceHub#focus
         * @description
         * Anounce to collaborators that we are working on the given field
         * and locale
         *
         * @param {string} fieldId  Internal field id
         * @param {string} localeCode  Internal locale code
         */
        function focus(fieldId, localeCode) {
          const path = ['fields', fieldId, localeCode].join('.');
          if (path !== ownFocusedPath) {
            shoutFieldFocus.cancel();
          }
          ownFocusedPath = path;
          shoutFieldFocus(path);
        }

        /**
         * @ngdoc method
         * @name PresenceHub#leave
         * @description
         * Announce to collaborators that we are leaving the document
         */
        function leave() {
          shout(['close', ownUserId]);
        }

        function removeTimedOutUsers() {
          presence = _.omitBy(presence, userPresence => {
            const timeSinceLastShout = new Date() - userPresence.shoutedAt;
            return timeSinceLastShout > PING_TIMEOUT;
          });
          updatePresence(presence);
        }

        function receiveShout(shoutArgs) {
          const type = shoutArgs[0];
          const from = shoutArgs[1];
          const focusedPath = shoutArgs[2];

          if (!presence[from]) {
            presence[from] = {};
          }

          presence[from].shoutedAt = new Date();

          if (type === 'open') {
            // Another user opened this document. Announce our presence to them.
            if (ownFocusedPath) {
              shout(['focus', ownUserId, ownFocusedPath]);
            } else {
              shout(['ping', ownUserId]);
            }
            presence[from] = {};
          }

          if (type === 'focus') {
            presence[from].focus = focusedPath;
          }

          if (type === 'close') {
            delete presence[from];
          }
          updatePresence(presence);
        }

        function updatePresence(presence) {
          collaboratorsBus.set(presenceUsers(presence));
          fieldCollaboratorsBus.set(groupPresenceByField(presence));
        }
      }

      function presenceUsers(presence) {
        return _(presence)
          .keys()
          .map(toUserLink)
          .value();
      }

      function groupPresenceByField(presence) {
        return _.transform(
          presence,
          (fieldPresence, userPresence, presenceUserId) => {
            const fieldId = userPresence.focus;
            if (fieldId) {
              fieldPresence[fieldId] = fieldPresence[fieldId] || [];
              fieldPresence[fieldId].push(toUserLink(presenceUserId));
            }
          },
          {}
        );
      }

      function toUserLink(id) {
        return { sys: { type: 'Link', linkType: 'User', id: id } };
      }
    }
  ]);
}
