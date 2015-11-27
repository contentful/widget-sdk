'use strict';

angular.module('contentful').factory('fieldAccessChecker', ['$injector', function ($injector) {

  var PolicyBuilder = $injector.get('PolicyBuilder');
  var spaceContext  = $injector.get('spaceContext');

  return {
    getInstance: getInstance
  };

  function getInstance(config) {
    var role = _.first(dotty.get(spaceContext, 'space.data.spaceMembership.roles', []));
    var internal = role ? PolicyBuilder.toInternal(role) : {};
    var allowed = dotty.get(internal, 'entries.allowed', []);
    var denied = dotty.get(internal, 'entries.denied', []);

    allowed = _.filter(allowed, pathPoliciesOnly);
    denied = _.filter(denied, pathPoliciesOnly);

    return {
      isEditable: isEditable,
      isEditableWithPredicate: isEditableWithPredicate,
      hasAllowPolicies: function () { return allowed.length > 0; }
    };

    function pathPoliciesOnly(p) {
      return (
        p.contentType === config.contentTypeId &&
        p.action === 'update' &&
        !_.isNull(p.locale) &&
        !_.isNull(p.field)
      );
    }

    function isEditable(field, locale) {
      var fieldId = field.apiName || field.id;
      var localeCode = locale.internal_code;
      var canUpdate = config.hasUpdatePermission;

      if (checkPolicyCollection(allowed, fieldId, localeCode)) {
        canUpdate = true;
      }
      if (checkPolicyCollection(denied, fieldId, localeCode)) {
        canUpdate = false;
      }

      return canUpdate;
    }

    function isEditableWithPredicate(pred) {
      return function (field, locale) {
        return pred() && isEditable(field, locale);
      };
    }
  }

  function checkPolicyCollection(collection, fieldId, localeCode) {
    return _.some(collection, function (p) {
      return (
        _.contains(['all', fieldId], p.field) &&
        _.contains(['all', localeCode], p.locale)
      );
    });
  }
}]);
