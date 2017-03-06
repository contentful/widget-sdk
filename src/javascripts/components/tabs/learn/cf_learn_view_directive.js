'use strict';

angular.module('contentful')

.directive('cfLearnView', function () {
  return {
    template: JST.cf_learn_view(),
    restrict: 'E',
    scope: true,
    controller: 'cfLearnViewController',
    controllerAs: 'learn'
  };
})

.controller('cfLearnViewController', ['$scope', 'require', '$element', function ($scope, require, $element) {

  var controller = this;
  var $q = require('$q');
  var $state = require('$state');
  var moment = require('moment');
  var spaceContext = require('spaceContext');
  var stateParams = require('$stateParams');
  var analytics = require('analytics/Analytics');
  var sdkInfoSupplier = require('sdkInfoSupplier');
  var WebhookRepository = require('WebhookRepository');

  var activatedAt = spaceContext.getData('activatedAt');

  controller.spaceId = stateParams.spaceId;

  // A/B experiment - onboarding-invite-users
  var K = require('utils/kefir');
  var LD = require('utils/LaunchDarkly');
  var onboardingInviteUsersTest$ = LD.get('onboarding-invite-users');
  var keycodes = require('keycodes');
  var userListHandler = require('UserListHandler').create();
  var spaceMembershipRepo =
    require('SpaceMembershipRepository').getInstance(spaceContext.space);
  var accessChecker = require('accessChecker');

  K.onValueScope($scope, onboardingInviteUsersTest$, function (shouldShow) {

    if (!accessChecker.canModifyUsers()) {
      return;
    }

    controller.showInviteUserTest = !!shouldShow;

    analytics.track('experiment:start', {
      experiment: {
        id: 'onboarding-invite-users',
        variation: shouldShow
      }
    });

    if (shouldShow) {
      initExperiment();
    }
  });

  function initExperiment () {
    userListHandler.reset().then(function () {
      controller.roleOptions = userListHandler.getRoleOptions();
      controller.role = _.first(controller.roleOptions);
    });

    controller.userLimit = _.get(
      spaceContext.getData('organization'),
      'subscriptionPlan.limits.permanent.organizationMembership'
    );

    controller.handleInviteUserKeyPress = function (event) {
      if (event.keyCode === keycodes.ENTER) {
        controller.inviteUser();
      }
    };

    controller.inviteUser = function () {
      var email = controller.email;

      if ($scope.inviteUserForm.$invalid || !email) {
        return;
      }

      analytics.track('invite_user:learn', {
        experiment: {
          id: 'onboarding-invite-users',
          variation: controller.showInviteUserTest
        }
      });

      controller.email = '';
      var isAdmin = userListHandler.isAdminRole(controller.role.id);
      var method = isAdmin ? 'inviteAdmin' : 'invite';
      return spaceMembershipRepo[method](email, controller.role.id)
      .then(function () {
        controller.message = {
          invalid: false,
          text: 'We’ve sent an email invite to \'' + email + '\'. They will be thrilled!'
        };
      })
      .catch(function (err) {
        var message = _.get(err, 'body.details.errors.0].name') === 'taken'
          ? 'There is already a user with the email address \'' + email + '\' in this space'
          : _.get(err, 'body.message');

        controller.message = {
          invalid: true,
          text: message
        };
      });
    };
  }

  // end A/B experiment

  function initLearnPage () {
    controller.contentTypes = spaceContext.publishedContentTypes;
    controller.activated = !!activatedAt;
    getEntries().then(function (entries) {
      controller.hasEntries = !!_.size(entries);
      controller.numberStepsCompleted = [
        controller.contentTypes.length,
        controller.hasEntries,
        controller.activated
      ].filter(function (val) {
        return !!val;
      }).length;
    })
    .then(maybeGetSecondPage)
    .finally(showPage);
  }

  function getEntries () {
    if (controller.contentTypes.length) {
      return spaceContext.space.getEntries();
    } else {
      return $q.resolve([]);
    }
  }

  function maybeGetSecondPage () {
    if (controller.numberStepsCompleted === 3) {
      return $q.all([
        spaceContext.space.getUsers(),
        WebhookRepository.getInstance(spaceContext.space).getAll()
      ]).then(setSecondPageSteps);
    }
  }

  function setSecondPageSteps (responses) {
    var hasUsers = responses[0].length > 1;
    var hasLocales = spaceContext.getData('locales').length > 1;
    var hasWebhooks = responses[1].length > 0;

    // Hide the note after one week post-activation
    controller.showNote = moment(activatedAt).add(7, 'days').isAfter(moment());

    controller.secondPageSteps = [
      {
        title: 'Invite users',
        buttonText: 'Invite users',
        linkText: 'View users',
        description: 'Invite your teammates to the space to get your project off the ground.',
        icon: 'learn-add-user',
        sref: 'spaces.detail.settings.users.list',
        completed: hasUsers
      }, {
        title: 'Locales',
        buttonText: 'Add locales',
        linkText: 'View locales',
        description: 'Set up locales to manage and deliver content in different languages.',
        icon: 'learn-locales',
        sref: 'spaces.detail.settings.locales.list',
        completed: hasLocales
      }, {
        title: 'Webhooks',
        buttonText: 'Add webhooks',
        linkText: 'View webhooks',
        description: 'Configure webhooks to send requests triggered by changes to your content.',
        icon: 'learn-webhooks',
        sref: 'spaces.detail.settings.webhooks.list',
        completed: hasWebhooks
      }
    ];
  }

  function showPage () {
    $scope.context.ready = true;
  }


  initLearnPage();
  // Refresh after new space creation as content types and entries might have been created
  $scope.$on('reloadEntries', initLearnPage);

  // Clicking `Use the API` goes to the delivery API key if there is exactly
  // one otherwise API home
  controller.goToApiKeySection = function () {
    controller.trackClickedButton('Use the API');
    spaceContext.space.getDeliveryApiKeys()
    .then(function (keys) {
      if (keys.length === 1) {
        var name = 'spaces.detail.api.keys.detail';
        var params = { apiKeyId: keys[0].data.sys.id };
        $state.go(name, params);
      } else {
        $state.go('spaces.detail.api.home');
      }
    });
  };

  // Languages and SDKs
  controller.selectLanguage = function (language) {
    if (!controller.selectedLanguage) {
      // Scroll to the bottom of the page
      var container = $element.find('.workbench-main');
      container.animate({scrollTop: container.scrollTop() + 260}, 'linear');
    }

    if (controller.selectedLanguage === language) {
      controller.selectedLanguage = undefined;
    } else {
      controller.selectedLanguage = language;
      analytics.track('learn:language_selected', {
        language: controller.selectedLanguage.name
      });
    }
  };

  var documentationList = ['documentation', 'apidemo', 'deliveryApi'];
  controller.languageData = sdkInfoSupplier.get(documentationList);
  controller.trackClickedButton = function (name) {
    analytics.track('learn:step_clicked', {linkName: name});
  };

  controller.trackResourceLink = function (linkName, language) {
    analytics.track('learn:resource_selected', {
      resource: linkName,
      language: language
    });
  };
}]);
