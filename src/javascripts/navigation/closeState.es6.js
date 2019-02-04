import { registerFactory } from 'NgRegistry.es6';
import contextHistory from 'navigation/Breadcrumbs/History.es6';

export default function register() {
  registerFactory('navigation/closeState', [
    '$q',
    '$state',
    '$location',
    'navigation/stateChangeHandlers',
    ($q, $state, $location, stateChangeHandlers) => {
      return closeState;

      function closeState() {
        stateChangeHandlers.setNavigationConfirmed(true);
        contextHistory.pop();

        return contextHistory.isEmpty() ? goToParent() : goToPreviousEntity();
      }

      function goToPreviousEntity() {
        // TODO This code is duplicated in `cfBreadcrumbsDirective`. Maybe
        // the context history is a better place for the shared code.
        const link = contextHistory.getLast().link;
        let state = link.state;

        // TODO The `contextHistory` should take care of setting the
        // correct state when a crumb is added.
        if ($state.includes('spaces.detail.environment')) {
          state = state.replace('spaces.detail', 'spaces.detail.environment');
        }

        return $state.go(state, link.params);
      }

      // TODO(mudit): Confirm that no where in the app is contextHistory empty
      // and remove this function
      function goToParent() {
        $location.url('/');
        return $q.when();
      }
    }
  ]);
}
