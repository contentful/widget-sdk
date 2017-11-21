'use strict';

/**
 * @ngdoc service
 * @name widgets/checks
 */
angular.module('contentful')
.factory('widgets/checks', ['require', function widgetChecks (require) {
  var $q = require('$q');

  var CHECKS = {
    kalturaEditor:           kalturaCredentialsCheck,
    kalturaMultiVideoEditor: kalturaCredentialsCheck
  };


  return {
    markMisconfigured: markMisconfigured
  };


  /**
   * @ngdoc method
   * @name widgets/checks#markMisconfigured
   * @param {Widget[]} widgets
   * @returns {Promise<Widget[]>}
   */
  function markMisconfigured(widgets) {
    var promises = _(widgets)
      .map(getCheck)
      .invokeMap('call')
      .value();

    return $q.all(promises).then(mark);

    function mark(results) {
      return _.forEach(widgets, function(widget, i) {
        _.merge(widget, results[i]);
      });
    }
  }

  function getCheck(widget) {
    var check = CHECKS[widget.id];
    return _.isFunction(check) ? check : _resolveWith(false);
  }

  function kalturaCredentialsCheck() {
    var kalturaCredentials = require('kalturaCredentials');
    var authorization      = require('authorization');
    var organizationId     = _.get(authorization, 'spaceContext.space.organization.sys.id', null);

    // there's really no way to say if get() call failed due to HTTP issue
    // or just because of lack of integration configuration
    return kalturaCredentials
      .get(organizationId)
      .then(_resolveWith(false), _resolveWith(true));
  }

  function _resolveWith(val) {
    return function() { return $q.resolve({ misconfigured: val }); };
  }

}]);
