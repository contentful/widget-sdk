'use strict';

angular.module('contentful')
.factory('entityEditor/publicationWarnings', ['require', function (require) {

  var $q = require('$q');

  var NO_GROUP = '__no_group';

  return {create: create};

  function create () {
    var warnings = [];

    return {
      register: register,
      show: show,
      getList: getList
    };

    function getList () {
      return warnings;
    }

    function register (warning) {
      warning = _.clone(warning);
      warning.getData = warning.getData || _.constant(null);
      warning.priority = _.isNumber(warning.priority) ? warning.priority : 0;

      warnings.push(warning);

      return function () {
        _.pull(warnings, warning);
      };
    }

    function show () {
      var processed = orderByPriority(mergeGroups());

      return _.reduce(processed, function (promise, warning) {
        return warning.shouldShow() ? promise.then(warning.warnFn) : promise;
      }, $q.resolve());
    }

    function mergeGroups () {
      var grouped = _.transform(warnings, function (acc, warning) {
        var group = _.isString(warning.group) ? warning.group : NO_GROUP;
        acc[group] = acc[group] || [];
        acc[group].push(warning);
      }, {});

      return _.transform(grouped, function (acc, inGroup, key) {
        if (key === NO_GROUP) {
          acc.push.apply(acc, inGroup);
        } else {
          acc.push(merge(inGroup));
        }
      }, []);
    }

    function merge (warnings) {
      var processed = _.filter(orderByPriority(warnings), _.method('shouldShow'));
      var highestPriority = _.first(processed) || {warnFn: $q.resolve(), priority: 0};

      return {
        shouldShow: function () {
          return processed.length > 0;
        },
        warnFn: function () {
          var data = _.map(processed, _.method('getData'));
          return highestPriority.warnFn(data);
        },
        priority: highestPriority.priority
      };
    }
  }

  function orderByPriority (warnings) {
    return _.orderBy(warnings, ['priority'], ['desc']);
  }
}]);
