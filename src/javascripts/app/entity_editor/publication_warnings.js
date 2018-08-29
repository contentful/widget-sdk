'use strict';

angular
  .module('contentful')

  /**
   * @ngdoc service
   * @name entityEditor/publicationWarnings
   * @description
   * This service allows extensions to register warnings that
   * can be presented before publishing an entity.
   *
   * @usage[js]
   * var warnings = require('entityEditor/publicationWarnings').create();
   *
   * warnings.register({
   *   // a function returning a boolean value indicating
   *   // if the warning should be shown
   *   shouldShow: function () { return true; },
   *
   *   // a function returning a promise; rejecting this promise
   *   // will break the chain of notifications
   *   warnFn: function (maybeData) { return $q.resolve(); },
   *
   *   // sometimes we want to merge warnings of a single type
   *   // so they act as one; warnings like this should be
   *   // registered with the same group name
   *   group: 'group-name',
   *
   *   // if using grouping, warnFn will be called with
   *   // an array of getData call results (for all warnings
   *   // in the group)
   *   getData: function () { return {}; },
   *
   *   // priority has two meanings:
   *   // - it determines the order in which warnings are shown
   *   // - when using groups, warnFn of with the highest
   *   //   priority will be called
   *   priority: 0
   * });
   *
   * warnings.show().then(function () {
   *   // no warnings or all warnings were confirmed
   * }, function () {
   *   // at least one warning resulted in cancellation
   * });
   */
  .factory('entityEditor/publicationWarnings', [
    'require',
    require => {
      const $q = require('$q');

      const NO_GROUP = '__no_group';

      return { create: create };

      function create() {
        const warnings = [];

        return {
          register: register,
          show: show,
          getList: getList
        };

        function getList() {
          return warnings;
        }

        function register(warning) {
          warning = _.clone(warning);
          warning.getData = warning.getData || _.constant(null);
          warning.priority = _.isNumber(warning.priority) ? warning.priority : 0;

          warnings.push(warning);

          return () => {
            _.pull(warnings, warning);
          };
        }

        function show() {
          const processed = orderByPriority(mergeGroups());

          return _.reduce(
            processed,
            (promise, warning) => (warning.shouldShow() ? promise.then(warning.warnFn) : promise),
            $q.resolve()
          );
        }

        function mergeGroups() {
          const grouped = _.transform(
            warnings,
            (acc, warning) => {
              const group = _.isString(warning.group) ? warning.group : NO_GROUP;
              acc[group] = acc[group] || [];
              acc[group].push(warning);
            },
            {}
          );

          return _.transform(
            grouped,
            (acc, inGroup, key) => {
              if (key === NO_GROUP) {
                acc.push(...inGroup);
              } else {
                acc.push(merge(inGroup));
              }
            },
            []
          );
        }

        function merge(warnings) {
          const processed = _.filter(orderByPriority(warnings), _.method('shouldShow'));
          const highestPriority = _.first(processed) || { warnFn: $q.resolve(), priority: 0 };

          return {
            shouldShow: function() {
              return processed.length > 0;
            },
            warnFn: function() {
              const data = _.map(processed, _.method('getData'));
              return highestPriority.warnFn(data);
            },
            priority: highestPriority.priority
          };
        }
      }

      function orderByPriority(warnings) {
        return _.orderBy(warnings, ['priority'], ['desc']);
      }
    }
  ]);
