'use strict';

/**
 * @ngdoc service
 * @name widgetChecks
 */
angular.module('contentful')
.factory('widgetChecks', ['$injector', function widgetChecks($injector) {
  var $q = $injector.get('$q');

  var CHECKS = {
    kalturaEditor:           kalturaCredentialsCheck,
    kalturaMultiVideoEditor: kalturaCredentialsCheck
  };

  var DEPRECATED = {
    youtubeEditor: {
      name: 'Youtube',
      alternative: 'Embedded Content'
    }
  };

  return {
    markMisconfigured: markMisconfigured,
    getMisconfigured:  getMisconfigured,
    getDeprecated:     function() { return DEPRECATED; }
  };

  /**
   * @ngdoc method
   * @name widgetChecks#markMisconfigured
   * @param {Widget[]} widgets
   * @returns {Promise}
   */
  function markMisconfigured(widgets) {
    var promises = _(widgets)
      .map(getCheck)
      .invoke('call')
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

  /**
   * @ngdoc method
   * @name widgetChecks#getMisconfigured
   * @param {Widget[]} widgets
   * @returns {Widget[]}
   */
  function getMisconfigured(widgets) {
    return _.reduce(widgets, toMisconfiguredOnly, {});
  }

  function toMisconfiguredOnly(acc, widget) {
    if (widget.misconfigured) { acc[widget.id] = widget; }
    return acc;
  }

  function kalturaCredentialsCheck() {
    var kalturaCredentials = $injector.get('kalturaCredentials');
    var authorization      = $injector.get('authorization');
    var organizationId     = dotty.get(authorization, 'spaceContext.space.organization.sys.id', null);

    // there's really no way to say if get() call failed due to HTTP issue
    // or just because of lack of integration configuration
    return kalturaCredentials
      .get(organizationId)
      .then(_resolveWith(false), _resolveWith(true));
  }

  function _resolveWith(val) {
    return function() { return $q.when({ misconfigured: val }); };
  }

}]);
