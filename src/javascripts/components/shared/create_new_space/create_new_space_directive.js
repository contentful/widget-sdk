// This directive is used for `new_space_dialog` as well as `onboarding_dialog`
// If `isOnboarding = true` is passed into the scope then it will display the
// onboarding version of the directive with a different headline, subheadline 
// and nav.


'use strict';

angular.module('contentful')
.directive('cfCreateNewSpace', function() {
  return {
    restrict: 'E',
    template: JST['create_new_space_directive'](),
    controller: 'createSpaceController',
    controllerAs: 'createSpace'
  };
});

angular.module('contentful')
.controller('createSpaceController', ['$scope', '$injector', function($scope, $injector) {
  var controller           = this;
  var $rootScope           = $injector.get('$rootScope');
  var client               = $injector.get('client');
  var localesList          = $injector.get('localesList');
  var spaceTemplateLoader  = $injector.get('spaceTemplateLoader');
  var spaceTemplateCreator = $injector.get('spaceTemplateCreator');
  var accessChecker        = $injector.get('accessChecker');
  var tokenStore           = $injector.get('tokenStore');
  var enforcements         = $injector.get('enforcements');
  var spaceTools           = $injector.get('spaceTools');
  var logger               = $injector.get('logger');
  var analytics            = $injector.get('analytics');
  var OrganizationList     = $injector.get('OrganizationList');
  var spaceContext         = $injector.get('spaceContext');

  // `true` if the directive is being used as part of the onboarding flow
  controller.isOnboarding         = $scope.isOnboarding;
  controller.organizations        = OrganizationList.getAll();
  // Keep track of the view state
  controller.viewState = 'createSpaceForm';

  // Set new space defaults
  controller.newSpace = {
    data: {
      defaultLocale: 'en-US'
    },
    useTemplate: false,
    errors: {fields: {}}
  };

  // Load the list of writable organizations
  controller.writableOrganizations = _.filter(controller.organizations, function (org) {
    return org && org.sys ? accessChecker.canCreateSpaceInOrganization(org.sys.id) : false;
  });

  if(controller.writableOrganizations.length > 0){
    controller.newSpace.organization = controller.writableOrganizations[0];
  }

  // Load the list of space templates
  controller.templates = [];
  spaceTemplateLoader.getTemplatesList().then(setupTemplates)
  .catch(function() {
    controller.templates = undefined;
  });

  // Populate locales
  controller.localesList = _.map(localesList, function(locale) {
    return {
      displayName: locale.name + ' (' + locale.code + ')',
      code: locale.code
    };
  });

  // Switch space template
  controller.selectTemplate = function(template) {
    if (!controller.createSpaceInProgress) {
      controller.newSpace.selectedTemplate = template;
    }
  };

  // Request space creation
  controller.requestSpaceCreation = function() {
    controller.createSpaceInProgress = true;
    if (controller.newSpace.useTemplate) {
      createNewSpace(controller.newSpace.selectedTemplate);
    } else {
      createNewSpace();
    }
  };

  // Finish creating space
  controller.finishedSpaceCreation = function() {
    var template = controller.newSpace.useTemplate ?
      controller.newSpace.selectedTemplate :
      { name: 'Blank' };
    $scope.dialog.confirm(template);
  };

  function setupTemplates(templates) {
    // Don't need this once the `Blank` template gets removed from Contentful
    controller.templates = _.reduce(templates, function(acc, template) {
      if (!template.fields.blank) {
        var fields = template.fields;
        acc.push(fields);
      }
      return acc;
    }, []);

    // Select default template
    controller.newSpace.selectedTemplate = _.first(controller.templates);
  }

  function createNewSpace(template) {
    if (!template) {
      template = {name: 'Blank'};
    }

    var data = controller.newSpace.data;
    var orgId = dotty.get(controller, 'newSpace.organization.sys.id');

    // Check user permissions
    if (!accessChecker.canCreateSpaceInOrganization(orgId)) {
      logger.logError('You can\'t create a Space in this Organization');
      return showFormError('You can\'t create a Space in this Organization');
    }

    // Send analytics event
    sendTemplateSelectedAnalyticsEvent(template.name);

    // Create space
    client.createSpace(data, orgId)
    .then(function(newSpace){
      tokenStore.refresh()
      .then(_.partial(handleSpaceCreation, newSpace, template));
    })
    .catch(handleSpaceCreationFailure);
  }

  function handleSpaceCreation(newSpace, template) {
    tokenStore.getSpace(newSpace.getId())
    .then(function (space) {
      return spaceTools.goTo(space, true);
    })
    .then(function() {
      controller.createTemplateInProgress = true;
      controller.viewState = 'creatingTemplate';
      if (template.name === 'Blank') {
        return createApiKey();
      } else {
        return loadSelectedTemplate();
      }
    })
    .finally(function() {
      // Just show the success message whatever happens
      controller.createTemplateInProgress = false;
      controller.createSpaceInProgress = false;
    });
  }

  function createTemplate(template, retried) {
    return controller.templateCreator.create(template)
    .catch(function (data) {
      if (retried) {
        _.each(data.errors, function (error) {
          analytics.track('Created Errored Space Template', {
            entityType: error.entityType,
            entityId: error.entityId,
            action: error.action
          });
        });
      } else {
        createTemplate(data.template, true);
      }
    });
  }

  function loadSelectedTemplate() {
    controller.templateCreator = spaceTemplateCreator.getCreator(spaceContext, {
      // no need to show status of individual items
      onItemSuccess: function() {},
      onItemError: function() {}
    });

    return spaceTemplateLoader.getTemplate(controller.newSpace.selectedTemplate)
    .then(createTemplate);
  }

  // Create an API key for blank templates
  function createApiKey() {
    var key = {
      name: 'Website Key',
      description: 'Use this key in your web application. API requests are sent directly to Contentful from your users’ browser.'
    };
    return spaceContext.space.createDeliveryApiKey(key);
  }

  function sendTemplateSelectedAnalyticsEvent(templateName) {
    analytics.track('Selected Space Template', {
      template: templateName
    });
    analytics.trackTotango('Selected Space Template: '+ templateName);
  }

  function handleSpaceCreationFailure(err) {
    controller.createSpaceInProgress = false;

    var errors = dotty.get(err, 'body.details.errors');
    var usage = enforcements.computeUsage('space');
    var fieldErrors = [
      {name: 'length', path: 'name', message: 'Space name is too long'},
      {name: 'invalid', path: 'default_locale', message: 'Invalid locale'}
    ];

    if (usage) {
      handleUsageWarning(usage);
      return;
    }

    _.forEach(fieldErrors, function(e) {
      if (hasErrorOnField(errors, e.path, e.name)) {
        showFieldError(e.path, e.message);
      }
    });

    if (!errors || !errors.length) {
      showFormError('Could not create Space. If the problem persists please get in contact with us.');
      logger.logServerWarn('Could not create Space', {error: err});
    }
  }

  // Form validations
  function hasErrorOnField(errors, fieldPath, errorName) {
    return _.some(errors, function(e) {
       return e.path === fieldPath && e.name === errorName;
    });
  }

  function resetErrors() {
    controller.newSpace.errors = { fields: {} };
  }

  function showFieldError(field, error) {
    controller.newSpace.errors.fields[field] = error;
  }

  function showFormError(error) {
    resetErrors();
    controller.newSpace.errors.form = error;
  }

  function handleUsageWarning(usage) {
    var enforcement = enforcements.determineEnforcement('usageExceeded');
    $rootScope.$broadcast('persistentNotification', {
      message: enforcement.message,
      actionMessage: enforcement.actionMessage,
      action: enforcement.action
    });
    showFormError(usage);
  }
}]);
