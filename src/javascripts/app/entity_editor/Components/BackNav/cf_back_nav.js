angular.module('contentful').directive('cfBackNav', [
  'require',
  function (require) {
    var _ = require('lodash');
    var React = require('react');
    var ReactDOM = require('react-dom');
    var BackNav = require('app/entity_editor/Components/BackNav').default;
    var LD = require('utils/LaunchDarkly');

    var SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG =
    'feature-at-05-2018-sliding-entry-editor-multi-level';

    return {
      link: function link ($scope, elem) {
        var state = {
          slideInFeatureFlagValue: 0
        };
        function render (props) {
          ReactDOM.render(
            React.createElement(
              BackNav,
              _.extend({}, props)
            ),
            elem[0]
          );
        }

        LD.onFeatureFlag($scope, SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG, function (flagValue) {
          state.slideInFeatureFlagValue = flagValue === 2 ? 2 : 0;
          render(state);
        });

        render(state);

        $scope.$on('$destroy', function () {
          ReactDOM.unmountComponentAtNode(elem[0]);
        });
      }
    };
  }
]);
