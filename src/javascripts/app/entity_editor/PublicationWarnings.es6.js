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

    const prms = await Promise.all(warnings.map(wn => wn.shouldShow()));

    const processed = warnings.filter((_w, i) => prms[i]);

    const highestPriority = _.first(processed) || { warnFn: Promise.resolve(), priority: 0 };

    return {
      shouldShow: () => {
        return processed.length > 0;
      },
      warnFn: () => {
        const data = processed.map(w => w.getData());
        return highestPriority.warnFn(data);
      },
      priority: highestPriority.priority
    };
  }
}

function orderByPriority(warnings) {
  return _.orderBy(warnings, ['priority'], ['desc']);
}
