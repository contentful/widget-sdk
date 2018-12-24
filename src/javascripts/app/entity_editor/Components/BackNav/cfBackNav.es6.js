import { registerDirective } from 'NgRegistry.es6';
import React from 'react';
import ReactDOM from 'react-dom';

registerDirective('cfBackNav', [
  'utils/LaunchDarkly/index.es6', // LD
  'app/entity_editor/Components/BackNav', // { default: BackNav }
  (LD, { default: BackNav }) => {
    const SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG = 'feature-at-05-2018-sliding-entry-editor-multi-level';

    return {
      link: function link($scope, elem) {
        const state = {
          slideInFeatureFlagValue: 0
        };
        function render(props) {
          ReactDOM.render(<BackNav {...props} />, elem[0]);
        }

        LD.onFeatureFlag($scope, SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG, flagValue => {
          state.slideInFeatureFlagValue = flagValue === 2 ? 2 : 0;
          render(state);
        });

        render(state);

        $scope.$on('$destroy', () => {
          ReactDOM.unmountComponentAtNode(elem[0]);
        });
      }
    };
  }
]);
