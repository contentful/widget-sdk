import _ from 'lodash';

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

  async function show() {
    const grouppedWarnings = await mergeGroups();

    const processed = orderByPriority(grouppedWarnings);

    const result = await _.reduce(
      processed,
      async (promise, warning) => {
        const shouldShow = await warning.shouldShow();

        if (shouldShow) {
          return await promise.then(warning.warnFn);
        }
        return promise;
      },
      Promise.resolve()
    );

    return result;
  }

  async function mergeGroups() {
    const grouped = _(warnings)
      .chain()
      .groupBy(warning => warning.group)
      .toPairs()
      .map(([, v]) => merge(v))
      .value();

    return Promise.all(grouped);
  }

  async function merge(warnings) {
    warnings = orderByPriority(warnings);

    const warningsWithData = await Promise.all(
      warnings.map(async warning => {
        const data = await warning.getData();
        return [warning, data, warning.shouldShow(data)];
      })
    );

    const processed = warningsWithData.filter(([, , shouldShowValue]) => shouldShowValue);

    const highestPriority = _.first(processed)[0] || { warnFn: Promise.resolve(), priority: 0 };

    return {
      shouldShow: () => processed.length > 0,
      warnFn: () => {
        return highestPriority.warnFn(processed.map(([, data]) => data));
      },
      priority: highestPriority.priority
    };
  }
}

function orderByPriority(warnings) {
  return _.orderBy(warnings, ['priority'], ['desc']);
}
