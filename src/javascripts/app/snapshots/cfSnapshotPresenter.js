import { registerDirective } from 'NgRegistry';
import _ from 'lodash';
import moment from 'moment';
import * as K from 'utils/kefir';

import createSnapshotExtensionBridge from 'widgets/bridges/createSnapshotExtensionBridge';
import { NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces';
import { userInputFromDatetime } from './dateUtils';
import * as EntityResolver from 'data/CMA/EntityResolver';
import generatePreview from 'markdown_editor/PreviewGenerator';
import { isRtlLocale } from 'utils/locales';
import * as EntityHelpers from 'app/entity_editor/entityHelpers';

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

  registerDirective('cfSnapshotPresenterMarkdown', [
    () => ({
      restrict: 'E',
      template: '<cf-markdown-preview class="markdown-preview" preview="preview" />',

      controller: [
        '$scope',
        $scope => {
          const markdown$ = K.fromScopeValue($scope, scope => scope.value);
          const preview$ = generatePreview(markdown$);
          K.onValueScope($scope, preview$, preview => {
            $scope.preview = preview.preview;
          });
        }
      ]
    })
  ]);

  registerDirective('cfSnapshotPresenterLink', [
    'spaceContext',
    spaceContext => ({
      restrict: 'E',

      template:
        '<cf-entity-link ' +
        [
          'ng-repeat="model in models"',
          'entity="model.entity"',
          'entity-helpers="helper"',
          'config="config"'
        ].join(' ') +
        ' />',

      controller: [
        '$scope',
        $scope => {
          const links = Array.isArray($scope.value) ? $scope.value : [$scope.value];
          const ids = links.map(link => link.sys.id);

          EntityResolver.fetchForType(spaceContext, $scope.linkType, ids).then(results => {
            $scope.models = results.map(entity => ({
              entity
            }));
          });

          $scope.helper = EntityHelpers.newForLocale($scope.locale.code);
          $scope.config = { minimized: true };
        }
      ]
    })
  ]);

  registerDirective('cfSnapshotPresenterDate', () => ({
    restrict: 'E',
    template: '<span>{{ dtString }}</span>',
    controller: [
      '$scope',
      $scope => {
        const dt = userInputFromDatetime($scope.value);
        const mode = _.get($scope, 'widget.settings.format', 'date');
        let s = moment(dt.date).format('dddd, MMMM Do YYYY');

        if (mode === 'date') {
          $scope.dtString = s;
          return;
        }

        if (parseInt(_.get($scope, 'widget.settings.ampm'), 10) !== 24) {
          const x = dt.time.split(':');
          s +=
            ', ' +
            moment()
              .hour(x[0])
              .minute(x[1])
              .format('LT');
        } else {
          s += ', ' + dt.time;
        }

        if (mode === 'timeZ') {
          s += ', UTC' + dt.utcOffset;
        }

        $scope.dtString = s;
      }
    ]
  }));
}
