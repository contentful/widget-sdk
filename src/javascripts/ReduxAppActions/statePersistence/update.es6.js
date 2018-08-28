// We keep all references to the requests in progress
// if they are in progress, we save new data
// after original update requests are done, we take these new values
// and make a new request. We also always return a promise which
// is resolved as soon as _all_ requests have succeeded.
const values = {};

// update state persistence API. if request is in progress, we'll save
// the new data, and update once again after original request is done.
export function update (args) {
  const { params, setPending, setSuccess, setFailure, fetch, key, payload, fallbackData } = args;

  if (!values[key]) {
    values[key] = {};
  }

  const { promise } = values[key];

  if (promise) {
    values[key].value = payload;
    let resolveFn;
    const newPromise = new Promise(resolve => {
      resolveFn = resolve;
    });

    values[key].promises.push(resolveFn);

    return newPromise;
  } else {
    // if we have a promise, we don't need to set it up
    setPending(params);
    const newPromise = fetch(payload);
    values[key] = {
      promise: newPromise,
      promises: []
    };

    return newPromise.then(newValue => {
      const { value, promises } = values[key];

      // you can write only JSON to the service
      // so value has to be an object
      if (value) {
        const valueWithSys = {
          ...value,
          sys: newValue.sys
        };

        // we need to remove value, since we are performing another request
        // with this value. If new request will come up, we'll end up here again
        // otherwise, we don't need it. All promises still have to be resolved
        // after all values being pushed to the server
        values[key].value = null;
        values[key].promise = null;

        return update({
          ...args,
          // we update fallbackData, since it is the latest successfull data
          // so in case the next request fails, we will rollback to the latest
          // reply from the server
          fallbackData: newValue,
          payload: valueWithSys
        });
      } else {
        setSuccess(newValue);
        promises.forEach(fn => fn(newValue));

        // dump all data for this key
        // next update will start it again
        values[key] = null;

        return newValue;
      }
    }, error => {
      const { value, promises } = values[key];

      // even we have an error, it is fine – we can try to write the next data
      // without changing sys property (since server failed to write an updated version)
      if (value) {
        values[key].value = null;
        values[key].promise = null;
        return update({
          ...args,
          payload: value
        });
      } else {
        setFailure({ error, fallbackData });
        promises.forEach(fn => fn(null));

        values[key] = null;
      }
    });
  }
}
