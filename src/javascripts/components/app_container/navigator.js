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
      // TODO we need to depend on 'widgets' so they get loaded before
      // the editing interface is created. It depends on the presence
      // of widgets if we construct the default interface. We MUST find
      // a proper solution for this. This also applies to
      // 'spaces.details.assets.detail
      editingInterface: ['$injector', 'contentType', 'widgets', function ($injector, contentType) {
        var editingInterfaces = $injector.get('editingInterfaces');
        return editingInterfaces.forContentType(contentType);
      }],
      contentType: ['$injector', 'entry', function ($injector, entry) {
        var spaceContext = $injector.get('spaceContext');

        return spaceContext.fetchPublishedContentType(entry.data.sys.contentType.sys.id);
      }],
      sidebarWidgets: [
        'editingInterface', 'contentType', 'widgets',
        function (editingInterface, contentType, Widgets) {
          return Widgets.buildSidebarWidgets(
            editingInterface.data.widgets,
            contentType.data.fields
          );
        }]
    },
    controller: ['$state', '$scope', 'entry', 'editingInterface', 'contentType', 'contextHistory', 'sidebarWidgets',
                 function ($state, $scope, entry, editingInterface, contentType, contextHistory, sidebarWidgets) {
      $state.current.data = $scope.context = {};
      $scope.entry = entry;
      $scope.entity = entry;
      $scope.editingInterface = editingInterface;
      $scope.contentType = contentType;
      $scope.sidebarWidgets = sidebarWidgets;
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
      editingInterface: ['$injector', 'contentType', 'widgets', function ($injector, contentType) {
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

  $stateProvider.state('spaces.detail.settings.users', {
    url: '/users',
    abstract: true,
    template: '<ui-view />'
  });

  $stateProvider.state('spaces.detail.settings.users.list', loadableState({
    url: '',
    ncyBreadcrumb: { label: 'Users and Roles' },
    template: '<cf-user-list />',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }]
  }));

  $stateProvider.state('spaces.detail.settings.users.detail', {
    url: '/:userId',
    ncyBreadcrumb: { label: 'User details' },
    template: '<pre>User details (ID: {{ $stateParams.userId }})</pre>'
  });

  $stateProvider.state('spaces.detail.settings.users.roleDetail', {
    url: '/roles/:roleId',
    ncyBreadcrumb: { label: 'Role details' },
    template: '<pre>Role details (ID: {{ $stateParams.roleId }})</pre>'
  });

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
    if (!definition.loadingText) {
      definition.loadingText = 'Loading your ' + definition.ncyBreadcrumb.label + '...';
    }

    definition.template = [
      '<div ng-show="context.ready">',
        definition.template,
      '</div>',
      '<div ng-hide="context.ready" class="workbench x--loading">',
        '<div class="workbench-loading__spinner"></div>',
        '<div class="workbench-loading__message">',
          definition.loadingText,
        '</div>',
      '</div>'
    ].join('');

    return definition;
  }
}]);
