import { registerDirective } from 'NgRegistry';
import _ from 'lodash';
import createSnapshotExtensionBridge from 'widgets/bridges/createSnapshotExtensionBridge';
import { NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces';
import { isRtlLocale } from 'utils/locales';
import { createNewReadOnlyWidgetApi } from 'app/widgets/NewWidgetApi/createNewWidgetApi';

import snapshotPresenterTemplate from './cf_snapshot_presenter.html';

export default function register() {
  /**
   * @ngdoc directive
   * @module cf.app
   * @name cfSnapshotPresenter
   * @description
   * This directive "presents" value of a field.
   * Directives prefixed with "cfSnapshotPresenter..."
   * implement logic needed for specific field
   * types (if the type is complex enough).
   */
  registerDirective('cfSnapshotPresenter', [
    'spaceContext',
    spaceContext => {
      return {
        restrict: 'E',
        template: snapshotPresenterTemplate,
        controller: [
          '$scope',
          $scope => {
            const { field, widgetNamespace, descriptor, parameters } = $scope.widget;
            $scope.type = getFieldType(field);
            $scope.linkType = _.get(field, 'linkType', _.get(field, 'items.linkType'));

            const entry = _.get($scope, ['entry', 'data'], {});
            const snapshot = _.get($scope, ['snapshot', 'snapshot'], {});
            $scope.entity = $scope.version === 'current' ? entry : snapshot;
            $scope.value = _.get($scope.entity, ['fields', field.id, $scope.locale.internal_code]);
            $scope.hasValue = !isEmpty($scope.value);
            $scope.createReadOnlyWidgetAPI = () => {
              const { cma } = spaceContext;
              const { locale, value: fieldValue } = $scope;
              const contentType = $scope.contentType.data;
              const entry = $scope.entity;
              return createNewReadOnlyWidgetApi({
                cma,
                field,
                fieldValue,
                locale,
                contentType,
                entry,
                initialContentTypes: spaceContext.publishedCTs.getAllBare()
              });
            };

            $scope.methods = {
              shouldDisplayRtl: isRtlLocale
            };

            $scope.features = {
              displayRichText: false
            };

            if (widgetNamespace === NAMESPACE_EXTENSION) {
              $scope.extensionProps = {
                bridge: createSnapshotExtensionBridge({ $scope, spaceContext }),
                descriptor,
                parameters
              };
            }
          }
        ]
      };

      function getFieldType(field) {
        if (field.type === 'Array') {
          const itemsType = field.items.type;
          return referenceOr(itemsType, 'Array<' + itemsType + '>');
        } else {
          return referenceOr(field.type);
        }
      }

      function referenceOr(type, alt) {
        return type === 'Link' ? 'Reference' : alt || type;
      }

      function isEmpty(v) {
        return v === null || v === undefined || v === '' || _.isEqual(v, []) || _.isEqual(v, {});
      }
    }
  ]);
}
