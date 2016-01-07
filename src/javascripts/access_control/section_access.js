'use strict';

angular.module('contentful').factory('sectionAccess', ['$injector', function ($injector) {

  var accessChecker = $injector.get('accessChecker');
  var $state        = $injector.get('$state');
  var $stateParams  = $injector.get('$stateParams');

  var BASE_STATE = 'spaces.detail';

  var SECTION_ACCESS_ORDER = [
    ['entry', 'entries.list'],
    ['contentType', 'content_types.list'],
    ['asset', 'assets.list'],
    ['apiKey', 'api.home'],
    ['settings', 'settings.users.list']
  ];

  return {
    hasAccessToAny: hasAccessToAny,
    redirectToFirstAccessible: redirectToFirstAccessible
  };

  function hasAccessToAny() {
    return _.isString(getFirstAccessibleSection());
  }

  function getFirstAccessibleSection() {
    var visibility = accessChecker.getSectionVisibility();

    return _(SECTION_ACCESS_ORDER)
      .map(extractVisibleState)
      .filter(_.isString)
      .first();

    function extractVisibleState(x) {
      return visibility[x[0]] ? x[1] : null;
    }
  }

  function redirectToFirstAccessible() {
    var firstAccessible = getFirstAccessibleSection();
    var currentStateName = dotty.get($state, '$current.name');
    var targetStateName = [BASE_STATE, firstAccessible].join('.');
    var spaceId = $stateParams.spaceId;

    if (currentStateName === BASE_STATE && spaceId && firstAccessible) {
      $state.go(targetStateName, {spaceId: spaceId});
    }
  }
}]);
