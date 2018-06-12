'use strict';

angular.module('contentful')

.directive('cfCreateNewSpace', ['require', require => {
  var template = require('components/shared/create_new_space/Template').default;
  return {
    restrict: 'E',
    template: template(),
    controller: 'createSpaceController',
    controllerAs: 'createSpace'
  };
}]);

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
  var TokenStore = require('services/TokenStore');
  var enforcements = require('access_control/Enforcements');
  var $state = require('$state');
  var logger = require('logger');
  var Analytics = require('analytics/Analytics');
  var spaceContext = require('spaceContext');
  var spaceTemplateEvents = require('analytics/events/SpaceCreation');
  var createResourceService = require('services/ResourceService').default;

  var DEFAULT_LOCALE = 'en-US';
  var DEFAULT_ERROR_MESSAGE = 'Could not create Space. If the problem persists please get in contact with us.';

  // Keep track of the view state
  controller.viewState = 'createSpaceForm';

  // Set new space defaults
  controller.newSpace = {
    data: {
      defaultLocale: DEFAULT_LOCALE
    },
    useTemplate: false,
    errors: {fields: {}}
  };

  controller.newSpace.organization = $scope.organization;

  // Load the list of space templates
  controller.templates = [];
  getTemplatesList().then(setupTemplates)
  .catch(() => {
    controller.templates = undefined;
  });

  // Populate locales
  controller.localesList = _.map(localesList, locale => ({
    displayName: locale.name + ' (' + locale.code + ')',
    code: locale.code
  }));

  // Scroll to bottom if example templates are opened and templates loaded
  $scope.$watch(() => controller.newSpace.useTemplate, usingTemplate => {
    if (usingTemplate && controller.templates) {
      $element.animate({scrollTop: $element.scrollTop() + 260}, 'linear');
    }
  });

  // Switch space template
  controller.selectTemplate = template => {
    if (!controller.createSpaceInProgress) {
      controller.newSpace.selectedTemplate = template;
    }
  };

  // Request space creation
  controller.requestSpaceCreation = () => {
    var organization = controller.newSpace.organization;

    var resources = createResourceService(organization.sys.id, 'organization');

    // First check that there are resources available
    // to create the space
    resources.canCreate('space').then(canCreate => {
      if (canCreate) {
        // Resources are available. Attempt to create a new space
        createNewSpace();
      } else {
        resources.messagesFor('space').then(errorObj => {
          handleUsageWarning(errorObj.error);
        });
      }
    }).catch(error => {
      showFormError(DEFAULT_ERROR_MESSAGE);
      logger.logServerWarn('Could not fetch permissions', {error: error});
    });
  };

  function setupTemplates (templates) {
    // Don't need this once the `Blank` template gets removed from Contentful
    controller.templates = _.reduce(templates, (acc, template) => {
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

  function createNewSpace () {
    var data = controller.newSpace.data;
    var organization = controller.newSpace.organization;
    var template = null;

    if (!validate(data)) {
      return;
    }

    if (organization.pricingVersion === 'pricing_version_2' && !data.productRatePlanId) {
      return showFormError('You must select a rate plan.');
    }

    if (controller.newSpace.useTemplate) {
      template = controller.newSpace.selectedTemplate;
    } else {
      template = {name: 'Blank'};
    }

    controller.createSpaceInProgress = true;

    Analytics.track('space:template_selected', {templateName: template.name});

    // if we use a template, we want to use DEFAULT_LOCALE
    var selectedLocale = controller.newSpace.useTemplate === true
      ? DEFAULT_LOCALE
      : data.defaultLocale;
    var dataWithUpdatedLocale = Object.assign({}, data, {
      defaultLocale: selectedLocale
    });

    client.createSpace(dataWithUpdatedLocale, organization.sys.id)
    .then(newSpace => {
      // Create space
      TokenStore.refresh()
        .then(_.partial(handleSpaceCreation, newSpace, template));
    })
    .catch(error => {
      var errors = _.get(error, 'body.details.errors');
      var fieldErrors = [
        {name: 'length', path: 'name', message: 'Space name is too long'},
        {name: 'invalid', path: 'default_locale', message: 'Invalid locale'}
      ];

      // If there aren't explicit errors from the response,
      // this means that something went wrong.
      if (!errors || !errors.length) {
        showFormError(DEFAULT_ERROR_MESSAGE);
        logger.logServerWarn('Could not create Space', {error: error});

        return;
      }

      _.forEach(fieldErrors, e => {
        if (hasErrorOnField(errors, e.path, e.name)) {
          showFieldError(e.path, e.message);
        }
      });
    });
  }

  function handleSpaceCreation (newSpace, template) {
    var templateName = _.get(template, 'name');

    $state.go('spaces.detail', {spaceId: newSpace.sys.id})
      .then(() => {
        var spaceCreateEventData =
            templateName === 'Blank'
            ? {templateName: templateName}
            : {templateName: templateName, entityAutomationScope: {scope: 'space_template'}};

        Analytics.track('space:create', spaceCreateEventData);

        if (templateName === 'Blank') {
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
      .finally(() => {
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
    createTemplatePromises.spaceSetup.catch(() => {});

    return createTemplatePromises
    .contentCreated
    .catch(data => {
      if (!retried) {
        createTemplate(data.template, true);
      }
    }).then(() => spaceContext.publishedCTs.refresh()).then(() => {
      // Picked up by the learn page which then refreshes itself
      $rootScope.$broadcast('spaceTemplateCreated');
    });
  }

  function loadSelectedTemplate () {
    var itemHandlers = {
      // no need to show status of individual items
      onItemSuccess: function (entityId, entityData, templateName) {
        spaceTemplateEvents.entityActionSuccess(
          entityId,
          Object.assign(
            {},
            entityData,
            {entityAutomationScope: {scope: 'space_template'}}
          ),
          templateName);
      },
      onItemError: _.noop
    };

    var selectedTemplate = controller.newSpace.selectedTemplate;
    var selectedLocale = controller.newSpace.useTemplate === true
      ? DEFAULT_LOCALE
      : controller.newSpace.data.defaultLocale;

    controller.templateCreator = spaceTemplateCreator.getCreator(
      spaceContext,
      itemHandlers,
      selectedTemplate,
      selectedLocale
    );
    return getTemplate(selectedTemplate)
    .then(createTemplate);
  }

  // Form validations
  function hasErrorOnField (errors, fieldPath, errorName) {
    return _.some(errors, e => e.path === fieldPath && e.name === errorName);
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
    var enforcement = enforcements.determineEnforcement(
      spaceContext.organization,
      ['usageExceeded'],
      'space'
    );
    $rootScope.$broadcast('persistentNotification', {
      message: enforcement.message,
      actionMessage: enforcement.actionMessage,
      action: enforcement.action
    });
    showFormError(usage);
  }
}]);
