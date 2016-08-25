'use strict';

angular.module('cf.app')

/**
 * @ngdoc service
 * @module cf.app
 * @name StringField
 * @description
 * This service handles setting value on string fields.
 */
.factory('entityEditor/Document/StringField', ['require', function (require) {
  var $q = require('$q');
  var diff = require('utils/StringDiff').diff;
  var ShareJS = require('data/ShareJS/Utils');

  var STRING_FIELD_TYPES = ['Symbol', 'Text'];

  return {
    setAt: setAt,
    is: isStringField
  };

  function setAt (doc, path, newValue) {
    var oldValue = ShareJS.peek(doc, path);

    if (!isValidStringFieldValue(newValue)) {
      return $q.reject(new Error('Invalid string field value.'));
    } else if (shouldSkipStringChange(oldValue, newValue)) {
      return $q.resolve(oldValue);
    } else if (shouldPatchString(oldValue, newValue)) {
      return patchStringAt(doc, path, oldValue, newValue);
    } else {
      return ShareJS.setDeep(doc, path, newValue);
    }
  }

  function isValidStringFieldValue (newValue) {
    return _.isNil(newValue) || _.isString(newValue);
  }

  function shouldSkipStringChange (oldValue, newValue) {
    // @todo experiment: do not store empty strings
    // if value is not set (undefined)
    return oldValue === undefined && newValue === '';
  }

  function shouldPatchString (oldValue, newValue) {
    return _.isString(oldValue) && _.isString(newValue) && oldValue !== newValue;
  }

  function patchStringAt (doc, path, oldValue, newValue) {
    var patches = diff(oldValue, newValue);

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
    var ops = patches.map(function (patch) {
      if (patch.delete) {
        return deleteOp(path, oldValue, patch);
      } else if (patch.insert) {
        return insertOp(path, patch);
      }
    });

    return $q.denodeify(function (cb) {
      // When patching - do it atomically
      return doc.submitOp(_.filter(ops), cb);
    });
  }

  function deleteOp (path, value, patch) {
    var pos = patch.delete[0];
    var len = patch.delete[1];

    return {
      p: path.concat(pos),
      sd: value.slice(pos, pos + len)
    };
  }

  function insertOp (path, patch) {
    return {
      p: path.concat(patch.insert[0]),
      si: patch.insert[1]
    };
  }

  function isStringField (fieldId, contentType) {
    var field = _.find(dotty.get(contentType, 'data.fields', []), function (field) {
      return field.id === fieldId;
    });

    return _.includes(STRING_FIELD_TYPES, field && field.type);
  }
}]);
