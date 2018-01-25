'use strict';

angular.module('contentful')

.directive('cfCreateNewSpace', function () {
  return {
    restrict: 'E',
    template: JST['create_new_space_directive'](),
    controller: 'createSpaceController',
    controllerAs: 'createSpace'
  };
});

angular.module('contentful')
.controller('createSpaceController', ['$scope', 'require', '$element', function ($scope, require, $element) {
  var controller = this;
  var $rootScope = require('$rootScope');
  var client = require('client');
  var localesList = require('localesList');
  var spaceTemplateLoader = require('services/SpaceTemplateLoader');
  var getTemplatesList = spaceTemplateLoader.getTemplatesList;
  var getTemplate = spaceTemplateLoader.getTemplate;
  var spaceTemplateCreator = require('services/SpaceTemplateCreator');
  var accessChecker = require('access_control/AccessChecker');
  var TokenStore = require('services/TokenStore');
  var K = require('utils/kefir');
  var enforcements = require('access_control/Enforcements');
  var $state = require('$state');
  var logger = require('logger');
  var Analytics = require('analytics/Analytics');
  var spaceContext = require('spaceContext');
  var spaceTemplateEvents = require('analytics/events/SpaceCreation');

  K.onValueScope($scope, TokenStore.organizations$, function (organizations) {
    controller.organizations = organizations;
  });

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

  // TODO This list should be empty. The create space dialog should not
  // be opened when the user has no writable organizations. But there
  // is a bug https://contentful.tpondemand.com/entity/18031
  controller.writableOrganizations = _.filter(controller.organizations, function (org) {
    return org && org.sys ? accessChecker.canCreateSpaceInOrganization(org.sys.id) : false;
  });

  controller.newSpace.organization = (
    _.find(controller.writableOrganizations, ['sys.id', $scope.organizationId]) ||
    _.first(controller.writableOrganizations)
  );

  // Load the list of space templates
  controller.templates = [];
  getTemplatesList().then(setupTemplates)
  .catch(function () {
    controller.templates = undefined;
  });

  // Populate locales
  controller.localesList = _.map(localesList, function (locale) {
    return {
      displayName: locale.name + ' (' + locale.code + ')',
      code: locale.code
    };
  });

  // Scroll to bottom if example templates are opened and templates loaded
  $scope.$watch(function () {
    return controller.newSpace.useTemplate;
  }, function (usingTemplate) {
    if (usingTemplate && controller.templates) {
      $element.animate({scrollTop: $element.scrollTop() + 260}, 'linear');
    }
  });

  // Switch space template
  controller.selectTemplate = function (template) {
    if (!controller.createSpaceInProgress) {
      controller.newSpace.selectedTemplate = template;
    }
  };

  // Request space creation
  controller.requestSpaceCreation = function () {
    if (!validate(controller.newSpace.data)) {
      return;
    }

    controller.createSpaceInProgress = true;
    if (controller.newSpace.useTemplate) {
      createNewSpace(controller.newSpace.selectedTemplate);
    } else {
      createNewSpace();
    }
  };

  function setupTemplates (templates) {
    // Don't need this once the `Blank` template gets removed from Contentful
    controller.templates = _.reduce(templates, function (acc, template) {
      if (!template.fields.blank) {
        var fields = template.fields;
        acc.push(fields);
      }
      return acc;
    }, []);

    // Select default template
    controller.newSpace.selectedTemplate = _.first(controller.templates);
  }

  function validate (data) {
    var hasSpaceName = data.name && data.name.length;
    if (!hasSpaceName) {
      showFormError('Please provide space name');
    }
    return hasSpaceName;
  }

  function createNewSpace (template) {
    if (!template) {
      template = {name: 'Blank'};
    }

    var data = controller.newSpace.data;
    var organization = controller.newSpace.organization;

    // TODO This may happen due to 'writableOrganizations' being empty.
    // See above for more info
    if (!organization) {
      return showFormError('You don’t have permission to create a space');
    }

    Analytics.track('space:template_selected', {
      templateName: template.name
    });
    // Create space
    client.createSpace(data, organization.sys.id)
    .then(function (newSpace) {
      TokenStore.refresh()
      .then(_.partial(handleSpaceCreation, newSpace, template));
    })
    .catch(function (error) {
      handleSpaceCreationFailure(organization, error);
    });
  }

  function handleSpaceCreation (newSpace, template) {
    Analytics.track('space:create', {
      templateName: _.get(template, 'name')
    });

    $state.go('spaces.detail', {spaceId: newSpace.sys.id})
    .then(function () {
      if (template.name === 'Blank') {
        spaceContext.apiKeyRepo.create(
          'Example Key',
          'We’ve created an example API key for you to help you get started.'
        );
        $scope.dialog.confirm();
      } else {
        controller.createTemplateInProgress = true;
        controller.viewState = 'creatingTemplate';
        return loadSelectedTemplate();
      }
    })
    .finally(function () {
      // Just show the success message whatever happens
      controller.createTemplateInProgress = false;
      controller.createSpaceInProgress = false;
    });
  }

  function createTemplate (template, retried) {
    const createTemplatePromises = controller.templateCreator.create(template);

    // we suppress errors, since `contentCreated` will handle them
    // We need to catch all errors, because http requests
    // are backed by $q, and we have global handlers on
    // $q errors
    createTemplatePromises.spaceSetup.catch(function () {});

    return createTemplatePromises
    .contentCreated
    .catch(function (data) {
      if (!retried) {
        createTemplate(data.template, true);
      }
    }).then(function () {
      return spaceContext.publishedCTs.refresh();
    }).then(function () {
      // Picked up by the learn page which then refreshes itself
      $rootScope.$broadcast('spaceTemplateCreated');
    });
  }

  function loadSelectedTemplate () {
    var itemHandlers = {
      // no need to show status of individual items
      onItemSuccess: spaceTemplateEvents.entityActionSuccess,
      onItemError: _.noop
    };

    var selectedTemplate = controller.newSpace.selectedTemplate;

    controller.templateCreator = spaceTemplateCreator.getCreator(
      spaceContext,
      itemHandlers,
      selectedTemplate.name,
      controller.newSpace.data.defaultLocale
    );
    return getTemplate(selectedTemplate)
    .then(createTemplate);
  }

  function handleSpaceCreationFailure (organization, err) {
    controller.createSpaceInProgress = false;

    var errors = _.get(err, 'body.details.errors');
    var usage = enforcements.computeUsageForOrganization(organization, 'space');
    var fieldErrors = [
      {name: 'length', path: 'name', message: 'Space name is too long'},
      {name: 'invalid', path: 'default_locale', message: 'Invalid locale'}
    ];

    if (usage) {
      handleUsageWarning(usage);
      return;
    }

    _.forEach(fieldErrors, function (e) {
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
  function hasErrorOnField (errors, fieldPath, errorName) {
    return _.some(errors, function (e) {
      return e.path === fieldPath && e.name === errorName;
    });
  }

  function resetErrors () {
    controller.newSpace.errors = { fields: {} };
  }

  function showFieldError (field, error) {
    controller.newSpace.errors.fields[field] = error;
  }

  function showFormError (error) {
    resetErrors();
    controller.newSpace.errors.form = error;
  }

  function handleUsageWarning (usage) {
    var enforcement = enforcements.determineEnforcement('usageExceeded');
    $rootScope.$broadcast('persistentNotification', {
      message: enforcement.message,
      actionMessage: enforcement.actionMessage,
      action: enforcement.action
    });
    showFormError(usage);
  }
}]);
