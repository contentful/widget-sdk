/*
  Returns a function that takes dispatch and wraps the
  given actions in the `actionsMap` with a dispatch call.

  Calling:

  ```
  wrapWithDispatch({
    fetchSpacePlans: actions.fetchSpacePlans
  })(dispatch)
  ```

  returns:

  ```
  {
    fetchSpacePlans: (...args) => dispatch(actions.fetchSpacePlans(...args))
  }
  ```
 */
export function wrapWithDispatch (actionsMap) {
  return dispatch => {
    return Object.keys(actionsMap).reduce((memo, actionName) => {
      const action = actionsMap[actionName];

      memo[actionName] = (...args) => dispatch(action(...args));

      return memo;
    }, {});
  };
}
