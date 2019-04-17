import { registerController } from 'NgRegistry.es6';
import { set as setAtPath, cloneDeep } from 'lodash';
import { Status, statusQueryKey } from 'app/ContentList/Search/Filters.es6';
import { Operator } from 'app/ContentList/Search/Operators.es6';

const makeArchivedView = () => ({
  searchFilters: [[statusQueryKey, Operator.EQUALS, Status.Archived]]
});

export default function register() {
  registerController('ListViewsController', [
    '$scope',
    '$location',
    'spaceContext',
    'entityType',
    'getBlankView',
    'resetList',
    'data/ListViewPersistor.es6',
    (
      $scope,
      $location,
      spaceContext,
      entityType,
      getBlankView,
      resetList,
      { default: createViewPersistor }
    ) => {
      const viewPersistor = createViewPersistor({
        spaceId: spaceContext.getId(),
        entityType,
        $location
      });

      $scope.loadView = loadView;
      $scope.loadArchived = () => loadView(makeArchivedView());

      $scope.$watch('context.view', viewPersistor.save, true);
      loadView(viewPersistor.read());

      function loadView(view) {
        setAtPath($scope, ['context', 'view'], {
          ...getBlankView(),
          ...cloneDeep(view || {})
        });

        resetList();
      }
    }
  ]);
}
