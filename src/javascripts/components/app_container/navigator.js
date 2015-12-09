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

  function filterDeletedLocales(data, availableLocales) {
    _.keys(data.fields).forEach(function (fieldId) {
      _.keys(data.fields[fieldId]).forEach(function (internal_code) {
        if (!_.find(availableLocales, { internal_code: internal_code })) {
          delete data.fields[fieldId][internal_code];
        }
      });
    });
  }

  $stateProvider.state('spaces', {
    url: '/spaces',
    abstract: true,
    resolve: {
      spaces: ['tokenStore', function (tokenStore) {
        return tokenStore.getSpaces();
      }]
    },
    views: {
      'content': { template: '<ui-view>' },
      'main-nav-bar': { template: '<cf-main-nav-bar>' }
    }
  });

  $stateProvider.state('spaces.new', {
    url: '_new',
    template: JST.cf_create_space_advice()
  });

  $stateProvider.state('spaces.detail', {
    url: '/:spaceId',
    resolve: {
      space: ['$injector', '$stateParams', function ($injector, $stateParams) {
        var tokenStore     = $injector.get('tokenStore');
        var spaceContext   = $injector.get('spaceContext');
        var analytics      = $injector.get('analytics');
        var TheLocaleStore = $injector.get('TheLocaleStore');
        return tokenStore.getSpace($stateParams.spaceId)
        .then(function (space) {
          spaceContext.resetWithSpace(space);
          TheLocaleStore.resetWithSpace(space);
          analytics.setSpace(space);
          return space;
        });
      }],
      widgets: ['$injector', 'space', function ($injector, space) {
        var Widgets = $injector.get('widgets');
        return Widgets.setSpace(space);
      }]
    },
    ncyBreadcrumb: {
      skip: true
    },
    // FIXME we depend on 'widgets' to load the service. We cannot use
    // the 'onEnter' handler because it does not wait until the promise
    // has been resolved.
    controller: ['$scope', 'space', 'widgets', function ($scope, space) {
      $scope.label = space.data.name;
    }],
    templateProvider: ['space', function (space) {
      if (space.isHibernated()) {
        return JST.cf_space_hibernation_advice();
      } else {
        return '<cf-breadcrumbs></cf-breadcrumbs>' +
               '<ui-view></ui-view>';
      }
    }],
  });


  $stateProvider.state('spaces.detail.entries', {
    url: '/entries',
    abstract: true,
    template: '<ui-view/>'
  });


  $stateProvider.state('spaces.detail.entries.list', loadableState({
    url: '',
    ncyBreadcrumb: {
      label: 'Entries'
    },
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }],
    template: '<div cf-entry-list class="workbench entry-list entity-list"></div>'
  }));


  $stateProvider.state('spaces.detail.entries.detail', {
    url: '/:entryId',
    params: { addToContext: false },
    ncyBreadcrumb: {
      parent: 'spaces.detail.entries.list',
      label: '{{context.title + (context.dirty ? "*" : "")}}'
    },
    resolve: {
      entry: ['$stateParams', 'space', function ($stateParams, space) {
        return space.getEntry($stateParams.entryId).then(function (entry) {
          filterDeletedLocales(entry.data, space.getPrivateLocales());
          return entry;
        });

      }],
      editingInterface: ['$injector', 'contentType', function ($injector, contentType) {
        var editingInterfaces = $injector.get('editingInterfaces');
        return editingInterfaces.forContentType(contentType);
      }],
      contentType: ['$injector', 'entry', function ($injector, entry) {
        var spaceContext = $injector.get('spaceContext');

        return spaceContext.fetchPublishedContentType(entry.data.sys.contentType.sys.id);
      }],

    },
    controller: ['$state', '$scope', 'entry', 'editingInterface', 'contentType', 'contextHistory',
                 function ($state, $scope, entry, editingInterface, contentType, contextHistory) {
      $state.current.data = $scope.context = {};
      $scope.entry = entry;
      $scope.entity = entry;
      $scope.editingInterface = editingInterface;
      $scope.contentType = contentType;
      contextHistory.addEntity(entry);
    }],
    template:
    '<div ' + [
      'cf-entry-editor',
      'class="workbench entry-editor"',
      'ot-doc-for="entry"',
      'cf-validate="entry.data"', 'cf-entry-schema',
      'ot-doc-presence'
    ].join(' ') + '></div>'
  });


  $stateProvider.state('spaces.detail.assets', {
    url: '/assets',
    abstract: true,
    template: '<ui-view/>'
  });


  $stateProvider.state('spaces.detail.assets.list', loadableState({
    url: '',
    ncyBreadcrumb: {
      label: 'Media Library'
    },
    template: '<div cf-asset-list class="workbench asset-list entity-list"></div>'
  }));


  $stateProvider.state('spaces.detail.assets.detail', {
    url: '/:assetId',
    params: { addToContext: false },
    ncyBreadcrumb: {
      parent: 'spaces.detail.assets.list',
      label: '{{context.title + (context.dirty ? "*" : "")}}'
    },
    resolve: {
      asset: ['$stateParams', 'space', function ($stateParams, space) {
        return space.getAsset($stateParams.assetId).then(function (asset) {
          filterDeletedLocales(asset.data, space.getPrivateLocales());
          return asset;
        });
      }],
      contentType: ['$injector', function ($injector) {
        var AssetContentType = $injector.get('AssetContentType');
        return {
          data: AssetContentType,
          getId: _.constant('asset'),
        };
      }],
      // TODO duplicates code in 'entries.details' state
      editingInterface: ['$injector', 'contentType', function ($injector, contentType) {
        var editingInterfaces = $injector.get('editingInterfaces');
        return editingInterfaces.forContentType(contentType);
      }],
    },
    controller: ['$state', '$scope', 'asset', 'contentType', 'editingInterface', 'contextHistory',
                 function ($state, $scope, asset, contentType, editingInterface, contextHistory) {
      $state.current.data = $scope.context = {};
      $scope.asset = asset;
      $scope.entity = asset;
      $scope.editingInterface = editingInterface;
      $scope.contentType = contentType;
      contextHistory.addEntity(asset);
    }],
    template:
    '<div ' + [
      'cf-asset-editor',
      'class="asset-editor workbench"',
      'ot-doc-for="asset"',
      'cf-validate="asset.data"', 'cf-asset-schema',
      'ot-doc-presence',
    ].join(' ') + '></div>'
  });


  $stateProvider.state('spaces.detail.content_types', {
    url: '/content_types',
    abstract: true,
    template: '<ui-view/>'
  });


  $stateProvider.state('spaces.detail.content_types.list', loadableState({
    url: '',
    ncyBreadcrumb: {
      label: 'Content Types'
    },
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }],
    template: '<div cf-content-type-list class="workbench"></div>'
  }));

  var contentTypeEditorState = {
    ncyBreadcrumb: {
      parent: 'spaces.detail.content_types.list',
      label: '{{contentType.getName() + (context.dirty ? "*" : "")}}'
    },
    controller: ['$state', '$scope', 'contentType', 'editingInterface', 'publishedContentType', function ($state, $scope, contentType, editingInterface, publishedContentType) {
      $scope.context = $state.current.data;
      $scope.contentType = contentType;
      $scope.editingInterface = editingInterface;
      $scope.publishedContentType = publishedContentType;
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
      }],
      publishedContentType: [function () {
        return null;
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
      publishedContentType: ['contentType', function (contentType) {
        return contentType.getPublishedStatus().catch(function (err) {
          if (err.statusCode === 404) {
            return null;
          } else {
            throw err;
          }
        });
      }],
      editingInterface: ['contentType', 'editingInterfaces', function (contentType, editingInterfaces) {
        return editingInterfaces.forContentType(contentType);
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
    template: '<div cf-api-home class="workbench"></div>'
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
    template: '<div cf-content-model class="workbench content-model entity-list"></div>'
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
    template: '<div cf-api-key-list class="workbench entity-list"></div>'
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
      'class="workbench"' +
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
    template: '<ui-view/>'
  });

  $stateProvider.state('spaces.detail.settings.locales', {
    url: '/locales',
    abstract: true,
    template: '<ui-view/>'
  });

  $stateProvider.state('spaces.detail.settings.locales.list', {
    url: '',
    ncyBreadcrumb: {
      label: 'Locales'
    },
    template: '<div cf-locale-list class="workbench locale-list entity-list"></div>'
  });

  var localeEditorState = {
    template: '<cf-locale-editor class="workbench">',
    ncyBreadcrumb: {
      parent: 'spaces.detail.settings.locales.list',
      label: '{{context.title + (context.dirty ? "*" : "")}}'
    },
    controller: ['$state', '$scope', 'locale', function ($state, $scope, locale) {
      $scope.context = $state.current.data;
      $scope.locale = locale;
    }]
  };

  $stateProvider.state('spaces.detail.settings.locales.new', _.extend({
    url: '_new',
    data: {
      isNew: true
    },
    resolve: {
      locale: ['$stateParams', 'space', function ($stateParams, space) {
        return space.newLocale({
          code: null,
          contentDeliveryApi: true,
          contentManagementApi: true
        });
      }]
    }
  }, localeEditorState));

  $stateProvider.state('spaces.detail.settings.locales.detail', _.extend({
    url: '/:localeId',
    data: {
      isNew: false
    },
    resolve: {
      locale: ['$stateParams', 'space', function ($stateParams, space) {
        return space.getLocale($stateParams.localeId);
      }]
    }
  }, localeEditorState));

  $stateProvider.state('spaces.detail.settings.iframe', {
    url: '',
    abstract: true,
    template: '<cf-space-settings>'
  });

  $stateProvider.state('spaces.detail.settings.iframe.pathSuffix', {
    url: '/{pathSuffix:PathSuffix}',
    params: {
      pathSuffix: 'edit'
    },
    ncyBreadcrumb: {
      label: '{{title}}'
    },
    template: '',
    controller: ['$scope', '$stateParams', function ($scope, $stateParams) {
      $scope.title = {
        edit: 'Space',
        users: 'Users',
        roles: 'Roles',
        webhook_definitions: 'Webhooks'
      }[$stateParams.pathSuffix];
    }]
  });


  $stateProvider.state('account', {
    url: '/account',
    abstract: true,
    views: {
      'content': {
        template: '<cf-account-view>'
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


  // TODO remove this state and replace it with a route redirect
  $stateProvider.state('otherwise', {
    url: '*path',
    template: ''
  });

  function loadableState(definition) {
    definition.template = [
      '<div ng-show="context.ready">' + definition.template + '</div>',
      '<div ng-hide="context.ready" class="workbench x--loading">',
        '<div class="workbench-loading__spinner"></div>',
        '<div class="workbench-loading__message">',
          'Loading your ' + definition.ncyBreadcrumb.label + '...',
        '</div>',
      '</div>'
    ].join('');

    return definition;
  }
}])
.run(['$injector', function ($injector) {
  var $rootScope     = $injector.get('$rootScope');
  var $document      = $injector.get('$document');
  var $state         = $injector.get('$state');
  var spaceTools     = $injector.get('spaceTools');
  var contextHistory = $injector.get('contextHistory');
  // Result of confirmation dialog
  var navigationConfirmed = false;

  $rootScope.$watch(function () {
    return $state.current.ncyBreadcrumbLabel;
  }, function (label) {
    $document[0].title = label || 'Contentful';
  });

  $rootScope.$on('$stateChangeStart', stateChangeStartHandler);
  $rootScope.$on('$stateChangeError', stateChangeErrorHandler);
  $rootScope.$on('$stateNotFound', stateChangeErrorHandler);

  // TODO Should not be a scope method
  $rootScope.closeState = closeState;

  function goToEntityState(entity) {
    if (entity.getType() === 'Entry') {
      $state.go('spaces.detail.entries.detail', {
        entryId: entity.getId(), addToContext: true
      });
    } else if (entity.getType() === 'Asset') {
      $state.go('spaces.detail.assets.detail', {
        assetId: entity.getId(), addToContext: true
      });
    }
  }

  function closeState() {
    var currentState = $state.$current;

    navigationConfirmed = true;
    contextHistory.pop();
    if (!contextHistory.isEmpty()) {
      goToEntityState(contextHistory.getLast());
    } else {
      $state.go((currentState.ncyBreadcrumb && currentState.ncyBreadcrumb.parent) || '');
    }
  }

  function stateChangeStartHandler(event, toState, toStateParams, fromState, fromStateParams) {
    if (fromState.name === toState.name &&
        getAddToContext(fromStateParams) === getAddToContext(toStateParams)) {
      event.preventDefault();
      return;
    }

    // Decide if it is OK to do the transition (unsaved changes etc)
    var stateData = fromState.data || {};
    var requestLeaveConfirmation = stateData.requestLeaveConfirmation;
    var needConfirmation = !navigationConfirmed &&
                           stateData.dirty &&
                           requestLeaveConfirmation;
    navigationConfirmed = false;
    if (needConfirmation) {
      event.preventDefault();
      requestLeaveConfirmation().then(function (confirmed) {
        if (confirmed) {
          navigationConfirmed = true;
          $state.go(toState.name, toStateParams);
        }
      });
      return;
    }

    preprocessStateChange(event, toState, toStateParams);
  }

  function preprocessStateChange(event, toState, toStateParams) {
    if (!toStateParams.addToContext) {
      contextHistory.purge();
    }

    // Some redirects away from nonexistent pages
    if (toState.name === 'spaces.detail') {
      event.preventDefault();
      if (_.isEmpty(toStateParams.spaceId)) {
        spaceTools.goToInitialSpace();
      } else {
        $state.go('spaces.detail.entries.list', toStateParams);
      }
    }

    if (toState.name === 'otherwise' || toState.name === 'spaces') {
      event.preventDefault();
      spaceTools.goToInitialSpace();
    }
  }

  /**
   * Switches to the first space's entry list if there is a navigation error
   */
  function stateChangeErrorHandler(event, toState, toParams, fromState, fromParams, error) {
    event.preventDefault();
    var matchedSection = /spaces.detail.(entries|assets|content_types|api\.keys).detail/.exec(toState.name);
    if(matchedSection && error.statusCode == 404){
      $state.go('spaces.detail.'+matchedSection[1]+'.list', { spaceId: toParams.spaceId });
    } else {
      spaceTools.goToInitialSpace();
    }
  }

  function getAddToContext(params) {
    return JSON.stringify(_.omit(params, 'addToContext'));
  }
}]);
