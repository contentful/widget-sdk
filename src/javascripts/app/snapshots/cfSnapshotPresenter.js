import { registerDirective } from 'NgRegistry';
import React from 'react';
import _ from 'lodash';
import EmbedlyPreview from 'components/forms/embedly_preview/EmbedlyPreview';
import createSnapshotExtensionBridge from 'widgets/bridges/createSnapshotExtensionBridge';
import { NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces';
import * as EntityResolver from 'data/CMA/EntityResolver';
import { isRtlLocale } from 'utils/locales';
import * as EntityHelpers from 'app/entity_editor/entityHelpers';
import { MarkdownPreview } from '@contentful/field-editor-markdown';
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

  registerDirective('cfSnapshotPresenterMarkdown', [
    () => ({
      restrict: 'E',
      template: '<react-component props="props" component="component" />',

      controller: [
        '$scope',
        $scope => {
          $scope.component = MarkdownPreview;
          $scope.props = {
            value: $scope.value,
            mode: 'zen',
            direction: 'ltr',
            previewComponents: {
              // eslint-disable-next-line
              embedly: ({ url }) => <EmbedlyPreview previewUrl={url} delay={100} />
            }
          };
        }
      ]
    })
  ]);

  registerDirective('cfSnapshotPresenterLink', [
    'spaceContext',
    spaceContext => ({
      restrict: 'E',

      template: `<div ng-repeat="model in models" ng-style='model.entity.sys.type === "Asset" ? {"display": "inline-block", "margin": "0px 10px 10px 0px"} : {}'>
          <react-component
            ng-if="model.entity.sys.type === 'Entry'"
            name="app/widgets/link/EntryLink"
            props="{entry:model.entity, entityHelpers:helper, getContentType}"
          />
          <react-component
            ng-if="model.entity.sys.type === 'Asset'"
            name="app/widgets/link/AssetLink"
            props="{asset:model.entity, entityHelpers:helper}"
          />
        </div>`,

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
          const getContentType = _.memoize(
            entity => spaceContext.publishedCTs.fetch(entity.sys.contentType.sys.id),
            entity => entity.sys.id
          );
          $scope.getContentType = getContentType;
        }
      ]
    })
  ]);
}
