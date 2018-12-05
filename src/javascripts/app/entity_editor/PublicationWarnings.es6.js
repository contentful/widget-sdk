import _ from 'lodash';

const NO_GROUP = '__no_group';

export function create() {
  const warnings = [];

  return {
    register,
    show,
    getList
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
      Promise.resolve()
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
    const highestPriority = _.first(processed) || { warnFn: Promise.resolve(), priority: 0 };

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
