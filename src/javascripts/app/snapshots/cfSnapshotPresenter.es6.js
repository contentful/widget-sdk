import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';
import moment from 'moment';
import * as K from 'utils/kefir.es6';
import { RTL_SUPPORT_FEATURE_FLAG } from 'featureFlags.es6';
import createBridge from 'widgets/SnapshotExtensionBridge.es6';

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
    'utils/LaunchDarkly/index.es6',
    'utils/locales.es6',
    'spaceContext',
    'TheLocaleStore',
    'Config.es6',
    (LD, { isRtlLocale }, spaceContext, TheLocaleStore, Config) => {
      return {
        restrict: 'E',
        template: JST.cf_snapshot_presenter(),
        controller: [
          '$scope',
          $scope => {
            const { field, custom, src, srcdoc } = $scope.widget;
            $scope.type = getFieldType(field);
            $scope.linkType = _.get(field, 'linkType', _.get(field, 'items.linkType'));

            const entry = _.get($scope, ['entry', 'data'], {});
            const snapshot = _.get($scope, ['snapshot', 'snapshot'], {});
            $scope.entity = $scope.version === 'current' ? entry : snapshot;
            $scope.value = _.get($scope.entity, ['fields', field.id, $scope.locale.internal_code]);
            $scope.hasValue = !isEmpty($scope.value);

            $scope.methods = {
              shouldDisplayRtl: _.constant(false)
            };

            $scope.features = {
              displayRichText: false
            };

            if (custom) {
              $scope.extensionProps = {
                bridge: createBridge({ $scope, spaceContext, TheLocaleStore }),
                src,
                srcdoc,
                appDomain: `app.${Config.domain}`
              };
            }

            LD.onFeatureFlag($scope, RTL_SUPPORT_FEATURE_FLAG, isEnabled => {
              // By default, all entity fields should be displayed as LTR unless the
              // RTL support feature flag is enabled.
              if (isEnabled) {
                $scope.methods.shouldDisplayRtl = isRtlLocale;
              }
            });
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
    'markdown_editor/PreviewGenerator.es6',
    ({ default: generatePreview }) => ({
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
    'EntityHelpers',
    'data/CMA/EntityResolver.es6',
    (spaceContext, EntityHelpers, EntityResolver) => ({
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

          const store = EntityResolver.forType($scope.linkType, spaceContext.cma);

          store.load(ids).then(results => {
            $scope.models = results.map(result => ({
              entity: result[1]
            }));
          });

          $scope.helper = EntityHelpers.newForLocale($scope.locale.code);
          $scope.config = { minimized: true };
        }
      ]
    })
  ]);

  registerDirective('cfSnapshotPresenterDate', [
    'widgets/datetime/data',
    Data => ({
      restrict: 'E',
      template: '<span>{{ dtString }}</span>',
      controller: [
        '$scope',
        $scope => {
          const dt = Data.userInputFromDatetime($scope.value);
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
    })
  ]);
}
