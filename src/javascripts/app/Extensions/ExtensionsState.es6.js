import { sortBy, filter, flow } from 'lodash/fp';
import spaceContext from 'spaceContext';
import { openGitHubInstaller } from './ExtensionsActions';

const detail = {
  name: 'detail',
  url: '/:extensionId',
  template: '<cf-extension-editor />',
  resolve: {
    extension: [
      'spaceContext',
      '$stateParams',
      (spaceContext, $stateParams) => spaceContext.cma.getExtension($stateParams.extensionId)
    ]
  },
  controller: [
    '$scope',
    'extension',
    ($scope, extension) => {
      $scope.extension = extension;
    }
  ]
};

export default {
  name: 'extensions',
  url: '/extensions',
  template: '<react-component name="app/Extensions/Extensions" props="props" />',
  resolve: {
    isAdmin: [
      'spaceContext',
      spaceContext => !!spaceContext.getData('spaceMembership.admin', false)
    ]
  },
  params: {
    // optional extensionUrl param to open GitHubInstaller
    extensionUrl: null
  },
  controller: [
    '$scope',
    '$stateParams',
    'isAdmin',
    ($scope, $stateParams, isAdmin) => {
      const decodedExtensionUrl = decodeURI($stateParams.extensionUrl || '');
      if (isAdmin && $stateParams.extensionUrl) {
        openGitHubInstaller(decodedExtensionUrl).then(() => {
          // clear extensionUrl
          // without it going back in browser history pops up installation modal again
          $stateParams.extensionUrl = null;
        });
      }

      const refresh = () =>
        spaceContext.widgets.refresh().then(widgets => {
          $scope.props.extensions = flow(
            filter('custom'),
            sortBy('name')
          )(widgets);
          $scope.$applyAsync();
        });

      if (isAdmin) {
        refresh();
      }

      $scope.props = {
        extensions: null,
        extensionUrl: decodedExtensionUrl,
        isAdmin,
        refresh
      };
    }
  ],
  children: [detail]
};
