import * as K from 'utils/kefir.es6';
import { last, findIndex } from 'lodash';

/**
 * This module exports a singleton 'breadcrumbsHistory' stack that records
 * navigation states, called `crumbs`.
 *
 * A crumb is added to the history when a new state is entered
 *
 * The context history is displayed by the 'breadcrumbs' component. This
 * component also allows the user to go back in the history.
 *
 * The `navigation/closeState` service also uses the context history to go back.
 */
export default createBreadcrumbsHistory();

// This is only exported for testing purposes
export function createBreadcrumbsHistory() {
  let history = [];
  const crumbBus = K.createPropertyBus(history);

  return {
    add,
    set,
    isEmpty,
    pop,
    purge,
    getLast: function() {
      return last(history);
    },
    crumbs$: crumbBus.property
  };

  function add(crumb) {
    let old;
    const index = findIndex(history, historyCrumb => historyCrumb.id === crumb.id);
    if (index > -1) {
      old = history[index];
      history = history.slice(0, index);
    }
    history.push({ ...old, ...crumb });
    crumbBus.set(history);
  }

  function set(newHistory) {
    history = newHistory;
    crumbBus.set(history);
  }

  function isEmpty() {
    return history.length === 0;
  }

  function pop() {
    const popped = history.pop();
    crumbBus.set(history);
    return popped;
  }

  function purge() {
    set([]);
  }
}
