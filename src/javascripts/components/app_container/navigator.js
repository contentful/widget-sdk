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
    template: JST.cf_create_space_advice(),
    controller: ['$scope', 'accessChecker', function($scope, accessChecker) {
      $scope.canCreateSpace = accessChecker.canCreateSpace;
    }]
  });

  $stateProvider.state('spaces.detail', {
    url: '/:spaceId',
    resolve: {
      spaceContext: ['$injector', '$stateParams', function ($injector, $stateParams) {
        var tokenStore     = $injector.get('tokenStore');
        var spaceContext   = $injector.get('spaceContext');
        var analytics      = $injector.get('analytics');
        return tokenStore.getSpace($stateParams.spaceId)
        .then(function (space) {
          analytics.setSpace(spaceContext.space);
          return spaceContext.resetWithSpace(space);
        });
      }],
      space: ['spaceContext', function (spaceContext) {
        return spaceContext.space;
      }],
      widgets: ['spaceContext', function (spaceContext) {
        return spaceContext.widgets;
      }]
    },
    ncyBreadcrumb: {
      skip: true
    },
    controller: ['$scope', 'space', 'sectionAccess', function ($scope, space, sectionAccess) {
      $scope.label = space.data.name;

      if (sectionAccess.hasAccessToAny()) {
        sectionAccess.redirectToFirstAccessible();
      }
    }],
    templateProvider: ['space', 'sectionAccess', function (space, sectionAccess) {
      if (space.isHibernated()) {
        return JST.cf_space_hibernation_advice();
      } else if (sectionAccess.hasAccessToAny()) {
        return '<cf-breadcrumbs></cf-breadcrumbs><ui-view></ui-view>';
      } else {
        return JST.cf_no_section_available();
      }
    }]
  });


  $stateProvider.state('spaces.detail.entries', {
    url: '/entries',
    abstract: true,
    template: '<ui-view/>'
  });


  $stateProvider.state('spaces.detail.entries.list', base({
    url: '',
    ncyBreadcrumb: {
      label: 'Entries'
    },
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }],
    template: '<div cf-entry-list class="workbench entry-list entity-list"></div>'
  }));

  editingInterfaceResolver.$inject = ['spaceContext', 'contentType'];
  function editingInterfaceResolver (spaceContext, contentType) {
    return spaceContext.editingInterfaces.get(contentType.data);
  }

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
      editingInterface: editingInterfaceResolver,
      contentType: ['$injector', 'entry', function ($injector, entry) {
        var spaceContext = $injector.get('spaceContext');
        var ctId = entry.data.sys.contentType.sys.id;
        return spaceContext.fetchPublishedContentType(ctId);
      }],
      editorWidgets: ['editingInterface', 'spaceContext', function (ei, spaceContext) {
        return spaceContext.widgets.buildRenderable(ei.widgets);
      }]
    },
    controller: ['$state', '$scope', 'entry', 'editorWidgets', 'contentType', 'contextHistory',
                 function ($state, $scope, entry, editorWidgets, contentType, contextHistory) {
      $state.current.data = $scope.context = {};
      $scope.entry = entry;
      $scope.entity = entry;
      $scope.contentType = contentType;
      $scope.formWidgets = editorWidgets.form;
      $scope.sidebarWidgets = editorWidgets.sidebar;
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


  $stateProvider.state('spaces.detail.assets.list', base({
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
      formWidgets: ['$injector', 'spaceContext', function ($injector, spaceContext) {
        var ei = $injector.get('data/editingInterfaces/asset');
        return spaceContext.widgets.buildRenderable(ei.widgets).form;
      }]
    },
    controller: ['$injector', '$scope', 'asset', 'formWidgets',
                 function ($injector, $scope, asset, formWidgets) {
      var $state = $injector.get('$state');
      $injector.get('contextHistory').addEntity(asset);
      $state.current.data = $scope.context = {};
      $scope.asset = $scope.entity = asset;
      $scope.formWidgets = formWidgets;
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


  $stateProvider.state('spaces.detail.content_types.list', base({
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
    controller:
      ['$state', '$scope', 'contentType', 'editingInterface', 'publishedContentType',
        function ($state, $scope, contentType, editingInterface, publishedContentType) {
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
      editingInterface: editingInterfaceResolver,
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
      contentType: ['$injector', '$stateParams', 'space', function ($injector, $stateParams, space) {
        var ctHelpers = $injector.get('data/ContentTypes');
        return space.getContentType($stateParams.contentTypeId)
        .then(function (ct) {
          // Some legacy content types do not have a name. If it is
          // missing we set it to 'Untitled' so we can display
          // something in the UI. Note that the API requires new
          // Content Types to have a name.
          ctHelpers.assureName(ct.data);
          return ct;
        });
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
      editingInterface: editingInterfaceResolver,
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


  $stateProvider.state('spaces.detail.api.keys.list', base({
    url: '/',
    ncyBreadcrumb: {
      label: 'Delivery Keys',
      parent: 'spaces.detail.api.home'
    },
    template: '<div cf-api-key-list class="workbench entity-list"></div>',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }]
  }));

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

  /**
   * Settings > Space Settings
   */

  $stateProvider.state('spaces.detail.settings.space', base({
    url: '/space',
    ncyBreadcrumb: {label: 'Space Settings'},
    loadingText: 'Loading Space Settings...',
    template: '<cf-space-settings />',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }]
  }));

  /**
   * Settings > Locale
   */

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

  /**
   * Settings > Users
   */

  $stateProvider.state('spaces.detail.settings.users', {
    url: '/users',
    abstract: true,
    template: '<ui-view />'
  });

  $stateProvider.state('spaces.detail.settings.users.list', base({
    url: '',
    ncyBreadcrumb: { label: 'Users' },
    loadingText: 'Loading Users...',
    template: '<cf-user-list class="workbench user-list" />',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }]
  }));

  /**
   * Settings > Roles
   */

  $stateProvider.state('spaces.detail.settings.roles', {
    url: '/roles',
    abstract: true,
    template: '<ui-view />'
  });

  $stateProvider.state('spaces.detail.settings.roles.list', base({
    url: '',
    ncyBreadcrumb: { label: 'Roles' },
    loadingText: 'Loading Roles...',
    template: '<cf-role-list class="workbench role-list" />',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }]
  }));

  $stateProvider.state('spaces.detail.settings.roles.new', {
    url: '/new',
    params: {
      baseRoleId: null
    },
    data: {
      isNew: true
    },
    ncyBreadcrumb: {
      parent: 'spaces.detail.settings.roles.list',
      label: '{{ context.title + (context.dirty ? "*" : "") }}'
    },
    resolve: {
      baseRole: ['RoleRepository', 'space', '$stateParams', '$q', function (RoleRepository, space, $stateParams, $q) {
        if (!$stateParams.baseRoleId) { return $q.when(null); }
        return RoleRepository.getInstance(space).get($stateParams.baseRoleId);
      }],
      emptyRole: ['RoleRepository', '$q', function (RoleRepository, $q) {
        return $q.when(RoleRepository.getEmpty());
      }]
    },
    template: '<cf-role-editor class="workbench role-editor" />',
    controller: ['$scope', '$state', 'baseRole', 'emptyRole', function ($scope, $state, baseRole, emptyRole) {
      $scope.context = $state.current.data;
      $scope.baseRole = baseRole;
      $scope.role = emptyRole;
    }]
  });

  $stateProvider.state('spaces.detail.settings.roles.detail', {
    url: '/:roleId',
    data: {
      isNew: false
    },
    ncyBreadcrumb: {
      parent: 'spaces.detail.settings.roles.list',
      label: '{{ context.title + (context.dirty ? "*" : "") }}'
    },
    resolve: {
      role: ['RoleRepository', 'space', '$stateParams', function (RoleRepository, space, $stateParams) {
        return RoleRepository.getInstance(space).get($stateParams.roleId);
      }]
    },
    template: '<cf-role-editor class="workbench role-editor" />',
    controller: ['$scope', '$state', 'role', function ($scope, $state, role) {
      $scope.context = $state.current.data;
      $scope.role = role;
    }]
  });

  /**
   * Settings > Webhooks
   */

  $stateProvider.state('spaces.detail.settings.webhooks', {
    url: '/webhooks',
    abstract: true,
    template: '<ui-view />'
  });

  $stateProvider.state('spaces.detail.settings.webhooks.list', base({
    url: '',
    ncyBreadcrumb: { label: 'Webhooks' },
    loadingText: 'Loading Webhooks...',
    template: '<cf-webhook-list class="workbench webhook-list" />',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }]
  }));

  $stateProvider.state('spaces.detail.settings.webhooks.new', {
    url: '/new',
    data: {
      isNew: true
    },
    ncyBreadcrumb: {
      parent: 'spaces.detail.settings.webhooks.list',
      label: '{{ context.title + (context.dirty ? "*" : "") }}'
    },
    template: '<cf-webhook-editor class="workbench webhook-editor" />',
    controller: ['$scope', '$state', function ($scope, $state) {
      $scope.context = $state.current.data;
      $scope.webhook = {};
    }]
  });

  $stateProvider.state('spaces.detail.settings.webhooks.detail', {
    url: '/:webhookId',
    data: {
      isNew: false
    },
    ncyBreadcrumb: {
      parent: 'spaces.detail.settings.webhooks.list',
      label: '{{ context.title + (context.dirty ? "*" : "") }}'
    },
    resolve: {
      webhook: ['WebhookRepository', 'space', '$stateParams', function (WebhookRepository, space, $stateParams) {
        return WebhookRepository.getInstance(space).get($stateParams.webhookId);
      }]
    },
    template: '<cf-webhook-editor class="workbench webhook-editor" />',
    controller: ['$scope', '$state', 'webhook', function ($scope, $state, webhook) {
      $scope.context = $state.current.data;
      $scope.webhook = webhook;
    }]
  });

  /**
   * Account view
   */

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

  function base(definition) {
    if (!definition.loadingText) {
      var label = dotty.get(definition, 'ncyBreadcrumb.label');
      definition.loadingText = label ? ('Loading your ' + label + '...') : 'Loading...';
    }

    definition.template = [
      '<div ng-show="context.ready && !context.forbidden">',
        definition.template,
      '</div>',
      '<div ng-show="!context.ready && !context.forbidden" class="workbench workbench-loading x--center">',
        '<div class="workbench-loading__spinner"></div>',
        '<div class="workbench-loading__message">',
          definition.loadingText,
        '</div>',
      '</div>',
      '<div ng-show="context.forbidden" class="workbench workbench-forbidden x--center">',
        '<div class="workbench-forbidden__headline">You don\'t have permission to access this view.</div>',
        '<div class="workbench-forbidden__message">Get in touch with the person administering Contentful at your company to learn more.</div>',
      '</div>'
    ].join('');

    return definition;
  }
}]);
