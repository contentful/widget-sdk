import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import { diff } from 'utils/StringDiff.es6';

export default function register() {
  /**
   * @ngdoc service
   * @module cf.app
   * @name StringField
   * @description
   * This service handles setting value on string fields.
   */
  registerFactory('entityEditor/Document/StringField', [
    '$q',
    'data/ShareJS/Utils',
    ($q, ShareJS) => {
      const STRING_FIELD_TYPES = ['Symbol', 'Text'];

      return {
        setAt: setAt,
        is: isStringField
      };

      function setAt(doc, path, newValue) {
        const oldValue = ShareJS.peek(doc, path);

        if (!isValidStringFieldValue(newValue)) {
          return $q.reject(new Error('Invalid string field value.'));
        } else if (newValue === '') {
          if (oldValue === undefined) {
            return $q.resolve(oldValue);
          } else {
            return ShareJS.setDeep(doc, path, undefined);
          }
        } else if (shouldPatchString(oldValue, newValue)) {
          return patchStringAt(doc, path, oldValue, newValue);
        } else {
          return ShareJS.setDeep(doc, path, newValue);
        }
      }

      function isValidStringFieldValue(newValue) {
        return _.isNil(newValue) || _.isString(newValue);
      }

      function shouldPatchString(oldValue, newValue) {
        return _.isString(oldValue) && _.isString(newValue) && oldValue !== newValue;
      }

      function patchStringAt(doc, path, oldValue, newValue) {
        const patches = diff(oldValue, newValue);

        /**
         * `diff` returns patches in the right order:
         * delete first, then insert (if both ops are needed).
         *
         * Patch is an object with properties:
         * - patch.delete[0] / patch.insert[0] is the start
         *   position of the operation
         * - patch.delete[1] is the number of characters that
         *   should be removed starting from the start pos.
         * - patch.insert[1] is the string to be inserted
         *   at the start position
         */
        const ops = patches.map(patch => {
          if (patch.delete) {
            return deleteOp(path, oldValue, patch);
          } else if (patch.insert) {
            return insertOp(path, patch);
          }
        });

        return $q.denodeify((
          cb // When patching - do it atomically
        ) => doc.submitOp(_.filter(ops), cb));
      }

      function deleteOp(path, value, patch) {
        const pos = patch.delete[0];
        const len = patch.delete[1];

        return {
          p: path.concat(pos),
          sd: value.slice(pos, pos + len)
        };
      }

      function insertOp(path, patch) {
        return {
          p: path.concat(patch.insert[0]),
          si: patch.insert[1]
        };
      }

      function isStringField(fieldId, contentType) {
        const field = _.find(_.get(contentType, 'data.fields', []), field => field.id === fieldId);

        return _.includes(STRING_FIELD_TYPES, field && field.type);
      }
    }
  ]);
}
