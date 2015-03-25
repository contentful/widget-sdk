'use strict';

angular.module('contentful').config([
  '$stateProvider',
  '$urlMatcherFactoryProvider',
  '$breadcrumbProvider',
  function ($stateProvider, $urlMatcherFactoryProvider, $breadcrumbProvider) {

  /*
   * We need to define a dumb type PathSuffix here and use that to
   * represent path suffixes for the Space Settings and Account
   * views, because otherwise UI-Router treats them as regular
   * URL parameters and does nasty things like escaping slashes.
   */
  $urlMatcherFactoryProvider.type('PathSuffix', {
    encode: function (val) { return val !== null? val.toString() : val; },
    decode: function (val) { return val !== null? val.toString() : val; },
    is: function (val) { return this.pattern.test(val); },
    pattern: /.*/
  });
  // Avoid being obsessive about matching states to trailing slashes
  $urlMatcherFactoryProvider.strictMode(false);

  $breadcrumbProvider.setOptions({
    template: JST.cf_structure_breadcrumbs()
  });

  $stateProvider.state('spaces', {
    abstract: true,
    url: '/spaces',
    resolve: {
      /*
       * This simply... checks or listens for an indication
       * that spaces have been loaded through a token request.
       * Descendant states are activated only once this resolve
       * is finished.
       */
      waitForSpaces: function ($rootScope, $q) {
        if (!$rootScope.spacesLoaded) {
          var deferred = $q.defer();
          var unListen = $rootScope.$watch('spacesLoaded', function (done) {
            if (done) {
              unListen();
              deferred.resolve();
            }
          });
          return deferred.promise;
        }
      }
    },
    views: {
      'main-container': { template: '<ui-view/>' },
      'space-nav-bar': { template: '<cf-main-nav-bar/>' }
    }
  })
  .state('spaces.detail', {
    template: '<cf-breadcrumbs></cf-breadcrumbs><div class="tab-content" ui-view></div>',
    url: '/:spaceId',
    ncyBreadcrumb: {
      label: '{{label}}'
    },
    resolve: {
      space: function ($stateParams, client) {
        return client.getSpace($stateParams.spaceId);
      }
    },
    controller: function ($scope, space, SpaceContext) {
      if ($scope.spaces) {
        var foundSpace = _.find($scope.spaces, function (space) {
          return space.getId() === $scope.$stateParams.spaceId;
        });
        if (foundSpace) {
          $scope.spaceContext = new SpaceContext(foundSpace);
          $scope.spaceContext.refreshContentTypes();
          $scope.label = foundSpace.data.name;
        }
      } else {
        $scope.spaceContext = new SpaceContext(space);
        $scope.label = space.data.name;
      }
    }
  })
  .state('spaces.detail.entries', {
    abstract: true,
    template: '<ui-view/>',
    url: '/entries'
  })
  .state('spaces.detail.entries.list', {
    url: '',
    template: '<div cf-entry-list class="entry-list entity-list"></div>',
    ncyBreadcrumb: {
      label: 'Entries'
    }
  })
  .state('spaces.detail.entries.detail', {
    url: '/:entryId',
    params: {
      addToContext: {
        value: false,
        squash: '~'
      }
    },
    template:
    '<div cf-entry-editor ' +
      'class="entry-editor entity-editor with-tab-actions"' +
      'ot-doc-for="entry"' +
      'cf-validate="entry.data" with-schema="entrySchema"' +
      'ng-class="{\'with-aux-panel\': preferences.showAuxPanel}"' +
      'ot-doc-presence>' +
    '</div>',
    ncyBreadcrumb: {
      parent: 'spaces.detail.entries.list',
      label: '{{context.title}}'
    },
    resolve: {
      entry: function ($stateParams, space) {
        return space.getEntry($stateParams.entryId);
      }
    },
    controller: function ($scope, $stateParams, entry) {
      $scope.context = {};
      $scope.entry = entry;

      if (!$scope.$root.contextHistory.length ||
          $stateParams.addToContext) {
        var index = _.findIndex($scope.$root.contextHistory, function (e) {
          return e.getId() === entry.getId();
        });
        if (index > -1) {
          $scope.$root.contextHistory.length = index;
        }
        $scope.$root.contextHistory.push(entry);
      }
    }
  })
  .state('spaces.detail.assets', {
    abstract: true,
    template: '<ui-view/>',
    url: '/assets'
  })
  .state('spaces.detail.assets.list', {
    url: '',
    template: '<div cf-asset-list class="entry-list entity-list"></div>',
    ncyBreadcrumb: {
      label: 'Assets'
    }
  })
  .state('spaces.detail.assets.detail', {
    url: '/:assetId',
    params: {
      addToContext: {
        value: false,
        squash: '~'
      }
    },
    template:
    '<div cf-asset-editor ' +
      'class="asset-editor entity-editor with-tab-actions"' +
      'ot-doc-for="asset"' +
      'cf-validate="asset.data" with-schema="assetSchema"' +
      'ng-class="{\'with-aux-panel\': preferences.showAuxPanel}"' +
      'ot-doc-presence>' +
    '</div>',
    ncyBreadcrumb: {
      parent: 'spaces.detail.assets.list',
      label: '{{context.title}}'
    },
    resolve: {
      asset: function ($stateParams, space) {
        return space.getAsset($stateParams.assetId);
      }
    },
    controller: function ($scope, $stateParams, asset) {
      $scope.context = {};
      $scope.asset = asset;

      if (!$scope.$root.contextHistory.length ||
          $stateParams.addToContext) {
        var index = _.findIndex($scope.$root.contextHistory, function (e) {
          return e.getId() === asset.getId();
        });
        if (index > -1) {
          $scope.$root.contextHistory.length = index;
        }
        $scope.$root.contextHistory.push(asset);
      }
    }
  })
  .state('spaces.detail.content_types', {
    abstract: true,
    template: '<ui-view/>',
    url: '/content_types'
  })
  .state('spaces.detail.content_types.list', {
    url: '',
    template: '<div cf-content-type-list class="entry-list entity-list"></div>',
    ncyBreadcrumb: {
      label: 'Content Types'
    },
    controller: function ($scope) {
      $scope.context = {};
    }
  })
  .state('spaces.detail.content_types.detail', {
    abstract: true,
    url: '/:contentTypeId',
    template: '<ui-view/>',
    resolve: {
      contentType: function ($stateParams, space) {
        return space.getContentType($stateParams.contentTypeId);
      }
    },
    controller: function ($scope, contentType) {
      $scope.contentType = contentType;
    }
  })
  .state('spaces.detail.content_types.detail.editor', {
    url: '',
    template:
    '<div cf-content-type-editor ' +
      'class="content-type-editor entity-editor with-tab-actions"' +
      'ot-doc-for="contentType"' +
      'cf-validate="contentType.data"' +
      'ng-class="{\'with-aux-panel\': preferences.showAuxPanel}">' +
    '</div>',
    ncyBreadcrumb: {
      parent: 'spaces.detail.content_types.list',
      label: '{{contentType.getName()}}'
    },
    controller: function ($scope) {
      $scope.context = {};
    }
  })
  .state('spaces.detail.content_types.detail.editing_interface', {
    url: '/editing_interface',
    template:
      '<div cf-editing-interface-editor ' +
        'class="editing-interface-editor with-tab-actions">' +
      '</div>',
    ncyBreadcrumb: {
      parent: 'spaces.detail.content_types.detail.editor',
      label: 'Configure Fields'
    },
    resolve: {
      editingInterface: function (contentType, editingInterfaces) {
        return editingInterfaces.forContentTypeWithId(contentType, 'default');
      }
    },
    controller: function ($scope, editingInterface) {
      $scope.context = {};
      $scope.editingInterface = editingInterface;
    }
  })
  .state('spaces.detail.api', {
    abstract: true,
    url: '/api',
    template: '<ui-view/>'
  })
  .state('spaces.detail.api.home', {
    url: '',
    ncyBreadcrumb: {
      label: 'API'
    },
    template:
      '<div cf-api-home ' +
        'class="api-home">' +
      '</div>'
  })
  .state('spaces.detail.api.content_model', {
    url: '/content_model',
    ncyBreadcrumb: {
      label: 'Content Model',
      parent: 'spaces.detail.api.home'
    },
    template:
      '<div cf-content-model ' +
        'class="content-model entity-list">' +
      '</div>',
    controller: function ($scope) {
      $scope.context = {};
    }
  })
  .state('spaces.detail.api.keys', {
    abstract: true,
    url: '/keys',
    template: '<ui-view/>'
  })
  .state('spaces.detail.api.keys.list', {
    url: '',
    ncyBreadcrumb: {
      label: 'Keys',
      parent: 'spaces.detail.api.home'
    },
    template:
      '<div cf-api-key-list ' +
        'class="api-key-list entity-list">' +
      '</div>'
  })
  .state('spaces.detail.api.keys.detail', {
    url: '/:apiKeyId',
    template:
    '<div cf-api-key-editor ' +
      'class="api-key--editor entity-editor with-tab-actions"' +
      'ng-class="{\'with-aux-panel\': preferences.showAuxPanel}">' +
    '</div>',
    ncyBreadcrumb: {
      parent: 'spaces.detail.api.keys.list',
      label: '{{context.title}}'
    },
    resolve: {
      apiKey: function ($stateParams, space) {
        if ($stateParams.apiKeyId === 'new') {
          return space.newDeliveryApiKey();
        }
        return space.getDeliveryApiKey($stateParams.apiKeyId);
      }
    },
    controller: function ($scope, $stateParams, apiKey) {
      $scope.context = {};
      $scope.apiKey = apiKey;
    }
  })
  .state('spaces.detail.settings', {
    url: '/settings',
    abstract: true,
    template:
    '<div cf-space-settings ' +
      'class="space-settings">' +
    '</div>'
  })
  .state('spaces.detail.settings.pathSuffix', {
    url: '/{pathSuffix:PathSuffix}',
    params: {
      pathSuffix: 'edit'
    },
    ncyBreadcrumb: {
      label: 'Settings'
    }
  })
  .state('account', {
    url: '/account',
    abstract: true,
    views: {
      'main-container': { template:
        '<div cf-account-view ' +
          'class="account-view tab-content">' +
        '</div>'
      }
    }
  })
  .state('account.pathSuffix', {
    url: '/{pathSuffix:PathSuffix}',
    params: {
      pathSuffix: 'profile/user'
    },
    ncyBreadcrumb: {
      label: 'Account'
    }
  })
  .state('otherwise', {
    url: '*path',
    template: ''
  });
}])
.run(['$rootScope', '$state', '$stateParams', function ($rootScope, $state, $stateParams) {
  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
  $rootScope.spacesLoaded = false;
  $rootScope.contextHistory = [];

  $rootScope.goToEntityState = function (entity, addToContext) {
    if (entity.getType() === 'Entry') {
      this.$state.go('spaces.detail.entries.detail', { entryId: entity.getId(), addToContext: addToContext });
    } else if (entity.getType === 'Asset') {
      this.$state.go('spaces.detail.assets.detail', { assetId: entity.getId(), addToContext: addToContext });
    }
  };

  $rootScope.closeState = function () {
    var currentState = this.$state.$current;
    this.contextHistory.pop();
    if (this.contextHistory.length) {
      this.goToEntityState(this.contextHistory[this.contextHistory.length - 1], true);
    } else {
      this.$state.go((currentState.ncyBreadcrumb && currentState.ncyBreadcrumb.parent) || '');
    }
  };
  $rootScope.$on('$stateChangeStart', function (event, toState, toStateParams) {
    if (!toStateParams.addToContext) {
      $rootScope.contextHistory.length = 0;
    }

    switch(toState.name) {
      case 'spaces.detail':
        event.preventDefault();
        $rootScope.$state.go('spaces.detail.entries.list', toStateParams); break;
      case 'spaces':
        event.preventDefault();
        $rootScope.$state.go(''); break;
    }
  });
}]);
