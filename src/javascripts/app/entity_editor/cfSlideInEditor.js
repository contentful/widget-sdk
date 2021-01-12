import { FLAGS, getVariation } from 'LaunchDarkly';
import { registerDirective } from 'core/NgRegistry';
import createEntityPageController from 'app/entity_editor/EntityPageController';
import entityPageTemplate from 'app/entity_editor/entity_page.html';

export const isNewSlideInEditorEnabled = [
  'spaceContext',
  (spaceContext) =>
    getVariation(FLAGS.NEW_SLIDE_IN_EDITOR, {
      organizationId: spaceContext.organization.sys.id,
      spaceId: spaceContext.space.data.sys.id,
      environmentId: spaceContext.space.environment.sys.id,
    }),
];

// Temporary route - handling requests according to feature flag
const baseDetails = {
  name: 'detail',
  resolve: {
    isNewSlideInEditorEnabled,
  },
  params: { addToContext: true },
  template: `
    <react-component
      ng-if="isNewSlideInEditorEnabled"
      name="app/entity_editor/SlideInEditor/SlideInEditor"
      props="props"
    ></react-component>
    <cf-slide-in-editor ng-if="!isNewSlideInEditorEnabled"></cf-slide-in-editor>
  `,
  controller: [
    '$scope',
    '$state',
    'isNewSlideInEditorEnabled',
    ($scope, $state, isNewSlideInEditorEnabled) => {
      $scope.isNewSlideInEditorEnabled = isNewSlideInEditorEnabled;

      if (isNewSlideInEditorEnabled) {
        // HACK (temporary) disable routing notification when using the new slide in editor
        $state.notify = false;
        // needs to be moved to `mapInjectedToProps` prop when feature flag is removed
        $scope.props = {
          ...$state.params,
          fields: $scope.fields,
          fieldController: $scope.fieldController,
        };
      }
    },
  ],
};

export function entryDetail(children) {
  return {
    ...baseDetails,
    url: '/:entryId?previousEntries&bulkEditor&tab',
    children: children,
  };
}

export function assetDetail() {
  return {
    ...baseDetails,
    url: '/:assetId?previousEntries&tab',
  };
}

export default () =>
  registerDirective('cfSlideInEditor', [
    () => ({
      template: entityPageTemplate,
      controller: ['$scope', '$state', createEntityPageController],
    }),
  ]);
