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
      spaces: function (tokenStore) {
        return tokenStore.getSpaces();
      }
    },
    views: {
      'app-container': { template: '<ui-view/>' },
      'main-nav-bar': { template: '<cf-main-nav-bar/>' }
    }
  })
  .state('spaces.detail', {
    template: '<cf-breadcrumbs></cf-breadcrumbs><div class="view-content" ui-view></div>',
    url: '/:spaceId',
    ncyBreadcrumb: {
      label: '{{label}}'
    },
    resolve: {
      space: function (tokenStore, $stateParams) {
        return tokenStore.getSpace($stateParams.spaceId);
      }
    },
    controller: function ($scope, space) {
      $scope.label = space.data.name;
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
    },
    controller: function ($scope) {
      $scope.context = {};
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
    '<div ' + [
      'cf-entry-editor',
      'class="entry-editor entity-editor with-tab-actions"',
      'ot-doc-for="entry"',
      'cf-validate="entry.data"', 'cf-entry-schema',
      'ng-class="{\'with-aux-panel\': preferences.showAuxPanel}"',
      'ot-doc-presence'
    ].join(' ') + '></div>',
    ncyBreadcrumb: {
      parent: 'spaces.detail.entries.list',
      label: '{{context.title + (context.dirty ? "*" : "")}}'
    },
    resolve: {
      entry: function ($stateParams, space) {
        return space.getEntry($stateParams.entryId);
      }
    },
    controller: function ($state, $scope, $stateParams, entry) {
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
    }
  })
  .state('spaces.detail.assets', {
    abstract: true,
    template: '<ui-view/>',
    url: '/assets'
  })
  .state('spaces.detail.assets.list', {
    url: '',
    template: '<div cf-asset-list class="asset-list entity-list"></div>',
    ncyBreadcrumb: {
      label: 'Media Library'
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
    '<div cf-asset-editor ' + [
      'cf-asset-editor',
      'class="asset-editor entity-editor with-tab-actions"',
      'ot-doc-for="asset"',
      'cf-validate="asset.data"', 'cf-asset-schema',
      'ng-class="{\'with-aux-panel\': preferences.showAuxPanel}"',
      'ot-doc-presence',
    ].join(' ') + '></div>',
    ncyBreadcrumb: {
      parent: 'spaces.detail.assets.list',
      label: '{{context.title + (context.dirty ? "*" : "")}}'
    },
    resolve: {
      asset: function ($stateParams, space) {
        return space.getAsset($stateParams.assetId);
      }
    },
    controller: function ($state, $scope, $stateParams, asset) {
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
    }
  })
  .state('spaces.detail.content_types', {
    abstract: true,
    template: '<ui-view/>',
    url: '/content_types'
  })
  .state('spaces.detail.content_types.list', {
    url: '',
    template: '<div cf-content-type-list class="content-type-list entity-list"></div>',
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
    '<div ' + [
      'cf-content-type-editor',
      'class="content-type-editor entity-editor with-tab-actions"',
      'ot-doc-for="contentType"',
      'cf-validate="contentType.data"', 'cf-content-type-schema',
      'ng-class="{\'with-aux-panel\': preferences.showAuxPanel}"',
    ].join(' ') + '></div>',
    ncyBreadcrumb: {
      parent: 'spaces.detail.content_types.list',
      label: '{{contentType.getName() + (context.dirty ? "*" : "")}}'
    },
    controller: function ($state, $scope) {
      $state.current.data = $scope.context = {};
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
    controller: function ($state, $scope, editingInterface) {
      $state.current.data = $scope.context = {};
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
      label: 'APIs'
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
      label: 'Delivery Keys',
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
      label: '{{context.title + (context.dirty ? "*" : "")}}'
    },
    resolve: {
      apiKey: function ($stateParams, space) {
        if ($stateParams.apiKeyId === 'new') {
          return space.newDeliveryApiKey();
        }
        return space.getDeliveryApiKey($stateParams.apiKeyId);
      }
    },
    controller: function ($state, $scope, $stateParams, apiKey) {
      $state.current.data = $scope.context = {};
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
      'app-container': {
        template:
        '<div cf-account-view ' +
          'class="account-view view-content">' +
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
.run(['$rootScope', '$state', '$stateParams', '$injector', function ($rootScope, $state, $stateParams, $injector) {
  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
  $rootScope.spacesLoaded = false;
  $rootScope.contextHistory = [];

  var modalDialog  = $injector.get('modalDialog'),
      $q           = $injector.get('$q'),
      $document    = $injector.get('$document'),
      $location    = $injector.get('$location'),
      notification = $injector.get('notification'),
      tokenStore   = $injector.get('tokenStore'),
      // Result of confirmation dialog
      navigationConfirmed = false;

  $rootScope.goToEntityState = function (entity, addToContext) {
    if (entity.getType() === 'Entry') {
      this.$state.go('spaces.detail.entries.detail', { entryId: entity.getId(), addToContext: addToContext });
    } else if (entity.getType === 'Asset') {
      this.$state.go('spaces.detail.assets.detail', { assetId: entity.getId(), addToContext: addToContext });
    }
  };

  $rootScope.closeState = function () {
    var currentState = this.$state.$current,
        contextHistory = this.contextHistory;

    confirmNavigation(currentState).then(function () {
      contextHistory.pop();
      if (contextHistory.length) {
        $rootScope.goToEntityState(contextHistory[contextHistory.length - 1], true);
      } else {
        $rootScope.$state.go((currentState.ncyBreadcrumb && currentState.ncyBreadcrumb.parent) || '');
      }
    });
  };

  $rootScope.$on('$stateChangeStart', function (event, toState, toStateParams, fromState, fromStateParams) {
    if (fromState.name === toState.name && getAddToContext(fromStateParams) === getAddToContext(toStateParams)) {
      event.preventDefault();
      return;
    }

    function preprocessChange() {
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

    // Decide if it is OK to do the transition (unsaved changes etc)
    if (!navigationConfirmed && fromState.data && fromState.data.dirty && fromState.data.closingMessage) {
      event.preventDefault();
      navigationConfirmed = false;
      confirmNavigation(fromState).then(function () {
        navigationConfirmed = true;
        preprocessChange();
      });
    } else {
      navigationConfirmed = false;
      preprocessChange();
    }
  });

  $rootScope.$watch('$state.current.ncyBreadcrumbLabel', function (label) {
    $document[0].title = label || 'Contentful';
  });

  $rootScope.$on('$stateChangeError', stateChangeErrorHandler);
  $rootScope.$on('$stateNotFound', stateChangeErrorHandler);

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
      var space = determineInitialSpace(spaces, spaceId);
      if(space)
        $rootScope.$state.go('spaces.detail', { spaceId: space.getId() });
      else
        $location.url('/');
    });
  }

  function determineInitialSpace(spaces, toSpaceId) {
    var space;
    if (toSpaceId) {
      space = _.find(spaces, function (space) {
        return space.getId() === toSpaceId;
      });
      if (!space) {
        notification.warn('Space does not exist or is unaccessable');
        space = spaces[0];
      }
    } else {
      space = spaces[0];
    }

    return space;
  }

  function getAddToContext(params) {
    return JSON.stringify(_.omit(params, 'addToContext'));
  }

  function confirmNavigation(state) {
    if (state.data && state.data.dirty && state.data.closingMessage) {
      return modalDialog.open({
        title: 'Unsaved Changes',
        confirmLabel: 'Discard Changes',
        cancelLabel: 'Return to Editor',
        className: 'discard-changes-dialog',
        html: true,
        message: prepareClosingMessage(state.data.closingMessage),
        scope: $rootScope
      }).promise;
    } else {
      return $q.when('done');
    }
  }

  function prepareClosingMessage(message) {
    if(_.isArray(message)){
      message = message.join('</p><p>');
    }
    return '<p>'+message+'</p>';
  }


}]);
