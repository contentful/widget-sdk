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
    url: '/spaces',
    abstract: true,
    resolve: {
      spaces: ['tokenStore', function (tokenStore) {
        return tokenStore.getSpaces();
      }]
    },
    views: {
      'app-container': { template: '<ui-view/>' },
      'main-nav-bar': { template: '<cf-main-nav-bar/>' }
    }
  });

  $stateProvider.state('spaces.new', {
    url: '_new',
    template: JST.cf_create_space_advice()
  });

  $stateProvider.state('spaces.detail', {
    url: '/:spaceId',
    resolve: {
      space: ['tokenStore', '$stateParams', function (tokenStore, $stateParams) {
        return tokenStore.getSpace($stateParams.spaceId);
      }]
    },
    ncyBreadcrumb: {
      skip: true
    },
    controller: ['$scope', 'space', function ($scope, space) {
      $scope.label = space.data.name;
    }],
    template: '<cf-breadcrumbs ng-hide="spaceContext.space.isHibernated()"></cf-breadcrumbs>' +
              '<div ng-hide="spaceContext.space.isHibernated()" class="view-content" ui-view></div>' +
              '<div ng-if="spaceContext.space.isHibernated()" cf-template="cf_space_hibernation_advice"></div>'
  });


  $stateProvider.state('spaces.detail.entries', {
    url: '/entries',
    abstract: true,
    template: '<ui-view/>'
  });


  $stateProvider.state('spaces.detail.entries.list', {
    url: '',
    ncyBreadcrumb: {
      label: 'Entries'
    },
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }],
    template: '<div cf-entry-list class="entry-list entity-list"></div>'
  });


  $stateProvider.state('spaces.detail.entries.detail', {
    url: '/:entryId',
    params: {
      addToContext: {
        value: false,
        squash: '~'
      }
    },
    ncyBreadcrumb: {
      parent: 'spaces.detail.entries.list',
      label: '{{context.title + (context.dirty ? "*" : "")}}'
    },
    resolve: {
      entry: ['$stateParams', 'space', function ($stateParams, space) {
        return space.getEntry($stateParams.entryId);
      }]
    },
    controller: ['$state', '$scope', '$stateParams', 'entry', function ($state, $scope, $stateParams, entry) {
      $state.current.data = $scope.context = {};
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
    }],
    template:
    '<div ' + [
      'cf-entry-editor',
      'class="entry-editor with-tab-actions"',
      'ot-doc-for="entry"',
      'cf-validate="entry.data"', 'cf-entry-schema',
      'ng-class="{\'with-aux-panel\': preferences.showAuxPanel}"',
      'ot-doc-presence'
    ].join(' ') + '></div>'
  });


  $stateProvider.state('spaces.detail.assets', {
    url: '/assets',
    abstract: true,
    template: '<ui-view/>'
  });


  $stateProvider.state('spaces.detail.assets.list', {
    url: '',
    ncyBreadcrumb: {
      label: 'Media Library'
    },
    template: '<div cf-asset-list class="asset-list entity-list"></div>'
  });


  $stateProvider.state('spaces.detail.assets.detail', {
    url: '/:assetId',
    params: {
      addToContext: {
        value: false,
        squash: '~'
      }
    },
    ncyBreadcrumb: {
      parent: 'spaces.detail.assets.list',
      label: '{{context.title + (context.dirty ? "*" : "")}}'
    },
    resolve: {
      asset: ['$stateParams', 'space', function ($stateParams, space) {
        return space.getAsset($stateParams.assetId);
      }]
    },
    controller: ['$state', '$scope', '$stateParams', 'asset', function ($state, $scope, $stateParams, asset) {
      $state.current.data = $scope.context = {};
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
    }],
    template:
    '<div cf-asset-editor ' + [
      'cf-asset-editor',
      'class="asset-editor with-tab-actions"',
      'ot-doc-for="asset"',
      'cf-validate="asset.data"', 'cf-asset-schema',
      'ng-class="{\'with-aux-panel\': preferences.showAuxPanel}"',
      'ot-doc-presence',
    ].join(' ') + '></div>'
  });


  $stateProvider.state('spaces.detail.content_types', {
    url: '/content_types',
    abstract: true,
    template: '<ui-view/>'
  });


  $stateProvider.state('spaces.detail.content_types.list', {
    url: '',
    ncyBreadcrumb: {
      label: 'Content Types'
    },
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }],
    template: '<div cf-content-type-list class="content-type-list entity-list"></div>'
  });

  var contentTypeEditorState = {
    ncyBreadcrumb: {
      parent: 'spaces.detail.content_types.list',
      label: '{{contentType.getName() + (context.dirty ? "*" : "")}}'
    },
    controller: ['$state', '$scope', 'contentType', 'editingInterface', function ($state, $scope, contentType, editingInterface) {
      $scope.context = $state.current.data;
      $scope.contentType = contentType;
      $scope.editingInterface = editingInterface;
    }],
    template:
    '<div ' + [
      'cf-content-type-editor',
      'class="workbench"',
      'cf-validate="contentType.data" cf-content-type-schema',
      'cf-ui-tab',
    ].join(' ') + '></div>'
  };

  $stateProvider.state('spaces.detail.content_types.new', _.extend({
    url: '_new',
    data: {
      isNew: true
    },
    resolve: {
      contentType: ['space', function (space) {
        return space.newContentType({sys: {type: 'ContentType'}, fields: []});
      }],
      editingInterface: ['contentType', 'editingInterfaces', function (contentType, editingInterfaces) {
        return editingInterfaces.defaultInterface(contentType);
      }]
    },
  }, contentTypeEditorState));

  $stateProvider.state('spaces.detail.content_types.detail', _.extend({
    url: '/:contentTypeId',
    data: {
      isNew: false
    },
    resolve: {
      contentType: ['$stateParams', 'space', function ($stateParams, space) {
        return space.getContentType($stateParams.contentTypeId);
      }],
      editingInterface: ['contentType', 'editingInterfaces', function (contentType, editingInterfaces) {
        return editingInterfaces.forContentTypeWithId(contentType, 'default');
      }]
    },
  }, contentTypeEditorState));


  $stateProvider.state('spaces.detail.api', {
    url: '/api',
    abstract: true,
    template: '<ui-view/>'
  });


  $stateProvider.state('spaces.detail.api.home', {
    url: '',
    ncyBreadcrumb: {
      label: 'APIs'
    },
    template: '<div cf-api-home class="api-home"></div>'
  });


  $stateProvider.state('spaces.detail.api.content_model', {
    url: '/content_model',
    ncyBreadcrumb: {
      label: 'Content Model',
      parent: 'spaces.detail.api.home'
    },
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }],
    template: '<div cf-content-model class="content-model entity-list"></div>'
  });


  $stateProvider.state('spaces.detail.api.keys', {
    abstract: true,
    url: '/keys',
    template: '<ui-view/>'
  });


  $stateProvider.state('spaces.detail.api.keys.list', {
    url: '/',
    ncyBreadcrumb: {
      label: 'Delivery Keys',
      parent: 'spaces.detail.api.home'
    },
    template: '<div cf-api-key-list class="api-key-list entity-list"></div>'
  });

  var apiKeyEditorState = {
    ncyBreadcrumb: {
      parent: 'spaces.detail.api.keys.list',
      label: '{{context.title + (context.dirty ? "*" : "")}}'
    },
    controller: ['$state', '$scope', '$stateParams', 'apiKey', function ($state, $scope, $stateParams, apiKey) {
      $state.current.data = $scope.context = {};
      $scope.apiKey = apiKey;
    }],
    template:
    '<div cf-api-key-editor ' +
      'class="api-key--editor with-tab-actions"' +
      'ng-class="{\'with-aux-panel\': preferences.showAuxPanel}">' +
    '</div>'
  };

  $stateProvider.state('spaces.detail.api.keys.new', _.extend({
    url: '_new',
    resolve: {
      apiKey: ['space', function (space) {
        return space.newDeliveryApiKey();
      }]
    }
  }, apiKeyEditorState));

  $stateProvider.state('spaces.detail.api.keys.detail', _.extend({
    url: '/:apiKeyId',
    resolve: {
      apiKey: ['$stateParams', 'space', function ($stateParams, space) {
        return space.getDeliveryApiKey($stateParams.apiKeyId);
      }]
    }
  }, apiKeyEditorState));


  $stateProvider.state('spaces.detail.settings', {
    url: '/settings',
    abstract: true,
    template: '<div cf-space-settings class="space-settings"></div>'
  });


  $stateProvider.state('spaces.detail.settings.pathSuffix', {
    url: '/{pathSuffix:PathSuffix}',
    params: {
      pathSuffix: 'edit'
    },
    ncyBreadcrumb: {
      label: 'Settings'
    }
  });


  $stateProvider.state('account', {
    url: '/account',
    abstract: true,
    views: {
      'app-container': {
        template: '<div cf-account-view class="account-view view-content"></div>'
      }
    }
  });


  $stateProvider.state('account.pathSuffix', {
    url: '/{pathSuffix:PathSuffix}',
    params: {
      pathSuffix: 'profile/user'
    },
    ncyBreadcrumb: {
      label: 'Account'
    }
  });


  $stateProvider.state('otherwise', {
    url: '*path',
    template: ''
  });
}])
.run(['$rootScope', '$state', '$stateParams', '$injector', function ($rootScope, $state, $stateParams, $injector) {
  var modalDialog  = $injector.get('modalDialog'),
      $q           = $injector.get('$q'),
      $document    = $injector.get('$document'),
      notification = $injector.get('notification'),
      tokenStore   = $injector.get('tokenStore'),
      spacesStore  = $injector.get('spacesStore'),
      // Result of confirmation dialog
      navigationConfirmed = false;

  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
  $rootScope.contextHistory = [];

  $rootScope.$watch('$state.current.ncyBreadcrumbLabel', function (label) {
    $document[0].title = label || 'Contentful';
  });

  $rootScope.$on('$stateChangeStart', stateChangeStartHandler);
  $rootScope.$on('$stateChangeError', stateChangeErrorHandler);
  $rootScope.$on('$stateNotFound', stateChangeErrorHandler);

  $rootScope.goToEntityState = goToEntityState;
  $rootScope.closeState = closeState;

  function goToEntityState(entity, addToContext) {
    if (entity.getType() === 'Entry') {
      $rootScope.$state.go('spaces.detail.entries.detail', {
        entryId: entity.getId(), addToContext: addToContext
      });
    } else if (entity.getType === 'Asset') {
      $rootScope.$state.go('spaces.detail.assets.detail', {
        assetId: entity.getId(), addToContext: addToContext
      });
    }
  }

  function closeState() {
    var currentState = $rootScope.$state.$current,
        contextHistory = $rootScope.contextHistory;

    confirmNavigation(currentState).then(function (reply) {
      if(reply.navConfirmed) {
        contextHistory.pop();
        if (contextHistory.length) {
          $rootScope.goToEntityState(contextHistory[contextHistory.length - 1], true);
        } else {
          $rootScope.$state.go((currentState.ncyBreadcrumb && currentState.ncyBreadcrumb.parent) || '');
        }
      }
    });
  }

  function stateChangeStartHandler(event, toState, toStateParams, fromState, fromStateParams) {
    if (fromState.name === toState.name &&
        getAddToContext(fromStateParams) === getAddToContext(toStateParams)) {
      event.preventDefault();
      return;
    }

    // Decide if it is OK to do the transition (unsaved changes etc)
    if (!navigationConfirmed && dotty.get(fromState, 'data.dirty') && dotty.exists(fromState, 'data.closingMessage')) {
      event.preventDefault();
      navigationConfirmed = false;
      confirmNavigation(fromState).then(function (reply) {
        if(reply.navConfirmed) {
          navigationConfirmed = true;
          preprocessStateChange(event, toState, toStateParams);
        }
      });
    } else {
      navigationConfirmed = false;
      preprocessStateChange(event, toState, toStateParams);
    }
  }

  function preprocessStateChange(event, toState, toStateParams) {
    if (!toStateParams.addToContext) {
      $rootScope.contextHistory.length = 0;
    }
    // Some redirects away from nonexistent pages
    switch(toState.name) {
      case 'spaces.detail':
        event.preventDefault();
        if(_.isEmpty(toStateParams.spaceId))
          navigateToInitialSpace();
        else
          $rootScope.$state.go('spaces.detail.entries.list', toStateParams); break;
      case 'otherwise':
      case 'spaces':
        event.preventDefault();
        navigateToInitialSpace(toStateParams.spaceId);
        break;
      default:
        if (navigationConfirmed) { $rootScope.$state.go(toState.name, toStateParams); }
    }
  }

  /**
   * Switches to the first space's entry list if there is a navigation error
   */
  function stateChangeErrorHandler(event, toState, toParams, fromState, fromParams, error) {
    event.preventDefault();
    var matchedSection = /spaces.detail.(entries|assets|content_types|api\.keys).detail/.exec(toState.name);
    if(matchedSection && error.statusCode == 404){
      $rootScope.$state.go('spaces.detail.'+matchedSection[1]+'.list', { spaceId: toParams.spaceId });
    } else {
      navigateToInitialSpace();
    }
  }

  function navigateToInitialSpace(spaceId) {
    tokenStore.getSpaces().then(function (spaces) {
      var space = determineInitialSpace(spaces, spaceId, spacesStore.getLastUsedSpace());
      if (space) {
        spacesStore.saveSelectedSpace(space.getId());
      }

      try {
        if (space) {
          $rootScope.$state.go('spaces.detail', { spaceId: space.getId() });
        } else {
          $rootScope.$state.go('spaces.new');
        }
      } catch(exp){
        logger.logError('Error navigating to initial space', {
          data: {
            exp: exp,
            msg: exp.message,
            spaceId: space ? space.getId() : null,
            state: $rootScope.$state
          }
        });
      }
    });
  }

  function determineInitialSpace(spaces, toSpaceId, lastUsedSpace) {
    var space;
    if (toSpaceId) {
      space = spacesStore.getSpaceFromList(toSpaceId, spaces);
      if(space) {
        return space;
      } else {
        notification.warn('Space does not exist or is unaccessable');
      }
    } else if(lastUsedSpace){
      space = spacesStore.getSpaceFromList(lastUsedSpace, spaces);
      if(space) {
        return space;
      }
    }
    return spaces[0];
  }

  function getAddToContext(params) {
    return JSON.stringify(_.omit(params, 'addToContext'));
  }

  function confirmNavigation(state) {
    if (state.data && state.data.dirty && state.data.closingMessage) {
      return modalDialog.open({
        title: 'Unsaved Changes',
        confirmLabel: 'Return to Editor',
        cancelLabel: 'Discard Changes',
        disableTopCloseButton: true,
        noBackgroundClose: true,
        html: true,
        message: prepareClosingMessage(state.data.closingMessage),
        scope: $rootScope
      }).promise
      .then(function () {
        // Primary confirm action in dialog means return to editor
        // which means navigation is not confirmed
        return {navConfirmed: false};
      }, function () {
        // Secondary cancel action in dialog means discard changes
        // which means we can navigate away from the current page
        return {navConfirmed: true};
      });
    } else {
      return $q.when({
        navConfirmed: true
      });
    }
  }

  function prepareClosingMessage(message) {
    if(_.isArray(message)){
      message = message.join('</p><p>');
    }
    return '<p>'+message+'</p>';
  }


}]);
