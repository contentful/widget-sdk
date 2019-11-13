import { registerController } from 'NgRegistry';
import { set as setAtPath, cloneDeep } from 'lodash';
import { Status, statusQueryKey } from 'app/ContentList/Search/Filters';
import { Operator } from 'app/ContentList/Search/Operators';

import createViewPersistor from 'data/ListViewPersistor';

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
    ($scope, $location, spaceContext, entityType, getBlankView, resetList) => {
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
