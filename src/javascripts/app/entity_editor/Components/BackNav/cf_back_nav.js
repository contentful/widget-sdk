angular.module('contentful').directive('cfBackNav', [
  'require',
  require => {
    const React = require('react');
    const ReactDOM = require('react-dom');
    const BackNav = require('app/entity_editor/Components/BackNav').default;
    const LD = require('utils/LaunchDarkly');

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
