import * as logger from 'services/logger.es6';

// We keep all references to the requests in progress
// if they are in progress, we save new data
// after original update requests are done, we take these new values
// and make a new request. We also always return a promise which
// is resolved as soon as _all_ requests have succeeded.
const updatingValues = {};

// update state persistence API. if request is in progress, we'll save
// the new data, and update once again after original request is done.
export function update(args) {
  const {
    params,
    setPending,
    setSuccess,
    setFailure,
    makeRequest,
    key,
    payload,
    fallbackData
  } = args;

  if (!updatingValues[key]) {
    updatingValues[key] = {};
  }

  // promise indicates that update for the key is in progress.
  // technically, we can get it from the redux itself, but this
  // is source of truth.
  const { updatePromise } = updatingValues[key];

  if (updatePromise) {
    // if promise already exists, we need to:
    // 1. save the future value. we want only the
    // last value, since we have optimistic updates
    // and version is bumped by the server
    updatingValues[key].nextUpdatePayload = payload;

    // we resolve all requests after all was saved (or failed)
    // if it was successfull, it resolves with server data
    // otherwise with `null`
    // you can safely wait for it using:
    // await dispatch(actions.updateUserEnvState(...));
    let resolveFn;
    const newPromise = new Promise(resolve => {
      resolveFn = resolve;
    });

    updatingValues[key].updateRequestPromises.push(resolveFn);

    return newPromise;
  } else {
    // if we have a promise, we don't need to set it up
    // however, right now this function will be called several
    // times, in case we need to do another update
    setPending(params);

    const requestPromise = makeRequest(payload);
    updatingValues[key].updatePromise = requestPromise;

    // if we are here first time, we need to create an array for updateRequestPromises
    if (!updatingValues[key].updateRequestPromises) {
      updatingValues[key].updateRequestPromises = [];
    }

    return requestPromise.then(
      newValue => {
        const { nextUpdatePayload, updateRequestPromises } = updatingValues[key];

        // you can write only JSON to the service
        // so value has to be an object
        if (nextUpdatePayload) {
          // we need to send new value, but `sys` was updated by the server
          // so we need to take the new value – since we use optimistic updates
          // it will include previously sent data in it, but we need an updates
          // sys property. Value itself should always contain all changes
          const valueWithSys = {
            ...nextUpdatePayload,
            sys: newValue.sys
          };

          // we need to remove value, since we are performing another request
          // with this value. If new request will come up, we'll end up here again
          // otherwise, we don't need it. All updateRequestPromises still have to be resolved
          // after all values being pushed to the server
          updatingValues[key].nextUpdatePayload = null;
          // also new promise will be written next time.
          updatingValues[key].updatePromise = null;

          return update({
            ...args,
            // we update fallbackData, since it is the latest data from the server
            // so in case the next request fails, we will rollback to the latest
            // reply from the server
            fallbackData: newValue,
            payload: valueWithSys
          });
        } else {
          setSuccess(newValue);
          updateRequestPromises.forEach(fn => fn(newValue));

          // dump all data for this key
          // next update will start it again
          updatingValues[key] = null;

          return newValue;
        }
      },
      error => {
        const { nextUpdatePayload, updateRequestPromises } = updatingValues[key];

        // even we have an error, it is fine – we can try to write the next data
        // without changing sys property (since server failed to write an updated version)
        if (nextUpdatePayload) {
          updatingValues[key].nextUpdatePayload = null;
          updatingValues[key].updatePromise = null;
          return update({
            ...args,
            payload: nextUpdatePayload
          });
        } else {
          logger.logError('State Persistence Update', {
            err: error,
            msg: error.message
          });
          // we need to write the latest data from the server to redux
          // this data can't be non-server, since this code is executed only by
          // the first updating request, not batching (all batching requests just give data).
          setFailure({ error, fallbackData });
          updateRequestPromises.forEach(fn => fn(null));

          updatingValues[key] = null;
        }
      }
    );
  }
}
