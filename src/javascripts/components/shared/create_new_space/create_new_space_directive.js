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
  var spaceTemplateLoader = require('spaceTemplateLoader');
  var spaceTemplateCreator = require('spaceTemplateCreator');
  var accessChecker = require('accessChecker');
  var tokenStore = require('tokenStore');
  var enforcements = require('enforcements');
  var $state = require('$state');
  var logger = require('logger');
  var analytics = require('analytics/Analytics');
  var OrganizationList = require('OrganizationList');
  var spaceContext = require('spaceContext');
  var spaceTemplateEvents = require('analytics/events/SpaceCreation');


  controller.organizations = OrganizationList.getAll();

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

  if (controller.writableOrganizations.length > 0) {
    controller.newSpace.organization = (
      _.find(controller.writableOrganizations, ['sys.id', $scope.organizationId]) ||
      _.first(controller.writableOrganizations)
    );
  } else {
    // TODO This should never happen, but unfortunately it does
    // We need to figure out why and fix it
    logger.logError('No writable organizations for space creation', {
      data: {
        writableOrganizations: controller.writableOrganizations
      }
    });
  }

  // A/B experiment - onboarding-invite-users
  var K = require('utils/kefir');
  var $q = require('$q');
  var LD = require('utils/LaunchDarkly');
  var onboardingInviteUsersTest$ = LD.get('onboarding-invite-users');
  var keycodes = require('keycodes');
  var spaceMembershipRepository = require('SpaceMembershipRepository');

  K.onValueScope($scope, onboardingInviteUsersTest$, function (shouldShow) {
    controller.showInviteUserTest = !!shouldShow;

    if (shouldShow) {
      controller.userLimit = _.get(
        controller.newSpace.organization,
        'subscriptionPlan.limits.permanent.organizationMembership'
      );

      controller.handleInviteUserKeyPress = function (event) {
        var value = controller.email;
        if (event.keyCode === keycodes.ENTER) {
          event.preventDefault();
          if (value) {
            controller.email = '';
            controller.usersToInvite.push(value);
          }
        }
      };

      controller.removeUser = function (index) {
        controller.usersToInvite.splice(index, 1);
      };

    }

    analytics.track('experiment:start', {
      experiment: {
        id: 'onboarding-invite-users',
        variation: shouldShow
      }
    });
  });

  controller.usersToInvite = [];

  function inviteUsers (space) {
    var inviteAdmin = spaceMembershipRepository.getInstance(space).inviteAdmin;
    if (controller.email) {
      controller.usersToInvite.push(controller.email);
    }
    return $q.all(_.uniq(controller.usersToInvite).map(inviteAdmin))
    // Don't care if any fail
    .catch(_.noop)
    .then(function () {
      return space;
    });
  }
  // End of A/B experiment code

  // Load the list of space templates
  controller.templates = [];
  spaceTemplateLoader.getTemplatesList().then(setupTemplates)
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

  // Finish creating space
  controller.finishedSpaceCreation = function () {
    var template = controller.newSpace.useTemplate
      ? controller.newSpace.selectedTemplate
      : { name: 'Blank' };
    $scope.dialog.confirm(template);
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
    var orgId = dotty.get(controller, 'newSpace.organization.sys.id');

    // TODO We should never be in this state
    if (!orgId) {
      logger.logError('No organization id set', {
        data: {
          currentOrg: controller.newSpace.organization
        }
      });
      return showFormError('You don’t have permission to create a space');
    }
    if (!accessChecker.canCreateSpaceInOrganization(orgId)) {
      logger.logError('You can\'t create a Space in this Organization');
      return showFormError('You can\'t create a Space in this Organization');
    }

    analytics.track('space:template_selected', {
      templateName: template.name
    });

    // Create space
    client.createSpace(data, orgId)
    .then(function (newSpace) {
      tokenStore.refresh()
      .then(_.partial(handleSpaceCreation, newSpace, template));
    })
    .catch(handleSpaceCreationFailure);
  }

  function handleSpaceCreation (newSpace, template) {
    analytics.track('space:create', {
      templateName: _.get(template, 'name')
    });

    tokenStore.getSpace(newSpace.getId())
    .then(inviteUsers)
    .then(function (space) {
      return $state.go('spaces.detail', {spaceId: space.getId()});
    })
    .then(function () {
      if (template.name === 'Blank') {
        createApiKey();
        controller.finishedSpaceCreation();
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
    return controller.templateCreator.create(template)
    .catch(function (data) {
      if (!retried) {
        createTemplate(data.template, true);
      }
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
      selectedTemplate.name
    );

    return spaceTemplateLoader.getTemplate(selectedTemplate)
    .then(createTemplate);
  }

  // Create an API key for blank templates
  function createApiKey () {
    var key = {
      name: 'Example Key',
      description: 'We’ve created an example API key for you to help you get started.'
    };
    return spaceContext.space.createDeliveryApiKey(key);
  }

  function handleSpaceCreationFailure (err) {
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
