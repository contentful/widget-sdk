'use strict';

angular.module('contentful')
.directive('cfOnboardingSteps', ['require', function (require) {
  var $state = require('$state');
  var $controller = require('$controller');
  var analytics = require('analytics/Analytics');
  var template = require('app/home/onboarding_steps/OnboardingStepsTemplate').default;
  var spaceContext = require('spaceContext');
  var WebhookRepository = require('WebhookRepository');
  var CreateSpace = require('services/CreateSpace');

  return {
    template: template(),
    restrict: 'E',
    scope: {},
    controller: ['$scope', function ($scope) {
      var controller = this;

      var steps = [
        {
          id: 'create_space',
          title: 'Create a space',
          description: 'A space is a place where you keep all the content related to a single project.',
          cta: 'Create space',
          icon: 'onboarding-space',
          page: 1
        },
        {
          id: 'create_content_type',
          title: 'Define the structure',
          description: 'Create your content model. It’s comprised of content types, which define the structure of your entries.',
          cta: 'Create a content type',
          icon: 'page-ct',
          page: 1,
          link: {
            text: 'View content model',
            state: 'spaces.detail.content_types.list'
          }
        },
        {
          id: 'create_entry',
          title: 'Create your content',
          description: 'Add an entry. They are your actual pieces of content, based on the content types you have created.',
          cta: 'Add an entry',
          icon: 'page-entries',
          page: 1,
          link: {
            text: 'View content',
            state: 'spaces.detail.entries.list'
          }
        },
        {
          id: 'use_api',
          title: 'Fetch your content',
          description: 'Use the API to see your content wherever you like. We’ll show you different ways of delivering your content.',
          cta: 'Use the API',
          icon: 'page-api',
          page: 1
        },
        {
          id: 'invite_user',
          title: 'Invite users',
          description: 'Invite your teammates to the space to get your project off the ground.',
          cta: 'Invite users',
          icon: 'onboarding-add-user',
          page: 2,
          link: {
            text: 'View users',
            state: 'spaces.detail.settings.users.list'
          }
        },
        {
          id: 'add_locale',
          title: 'Locales',
          description: 'Set up locales to manage and deliver content in different languages.',
          cta: 'Add locales',
          icon: 'onboarding-locales',
          page: 2,
          link: {
            text: 'View locales',
            state: 'spaces.detail.settings.locales.list'
          }
        },
        {
          id: 'create_webhook',
          title: 'Webhooks',
          description: 'Configure webhooks to send requests triggered by changes to your content.',
          cta: 'Add webhooks',
          icon: 'onboarding-webhooks',
          page: 2,
          link: {
            text: 'View webhooks',
            state: 'spaces.detail.settings.webhooks.list'
          }
        }
      ];

      var actions = [
        createSpace,
        addContentType,
        addEntry,
        goToApiKeySection,
        goToSettings('users'),
        goToSettings('locales'),
        goToSettings('webhooks')
      ];

      controller.steps = _.zipWith(steps, actions, function (step, action) {
        step.action = action.bind(null, step);
        return step;
      });

      if (spaceContext.space) {
        initSpaceHomePage();
        // Refresh after new space creation as content types and entries might have been created
        $scope.$on('spaceTemplateCreated', initSpaceHomePage);
      } else {
        initHomePage();
      }

      function initHomePage () {
        controller.currentPage = 1;
        setCompletionStep(0);
      }

      function initSpaceHomePage () {
        var hasContentTypes = spaceContext.publishedContentTypes.length > 0;
        var isActivated = !!spaceContext.getData('activatedAt');

        controller.currentPage = isActivated && hasContentTypes ? 2 : 1;

        if (controller.currentPage === 1) {
          getOnboardingSteps();
        } else {
          getOtherSteps();
        }
      }

      function getOnboardingSteps () {
        var hasContentTypes = spaceContext.publishedContentTypes.length > 0;

        if (hasContentTypes) {
          spaceContext.space.getEntries().then(function (entries) {
            var hasEntries = !!_.size(entries);
            var nextStep = hasEntries ? 3 : 2;
            setCompletionStep(nextStep);
          });
        } else {
          setCompletionStep(1);
        }
      }

      function setCompletionStep (nextStepIdx) {
        // Set previous steps to completed and disable future steps
        // This is for the first page only
        controller.steps.slice(0, 4).forEach(function (step, i) {
          step.disabled = false;
          step.completed = i < nextStepIdx;

          if (i > nextStepIdx) {
            step.disabled = true;
          }
        });
      }

      function getOtherSteps () {
        var hasLocales = spaceContext.getData('locales').length > 1;
        controller.steps[5].completed = hasLocales;

        spaceContext.space.getUsers().then(function (users) {
          controller.steps[4].completed = users.length > 1;
        });

        WebhookRepository.getInstance(spaceContext.space).getAll()
        .then(function (webhooks) {
          controller.steps[6].completed = webhooks.length > 0;
        });
      }

      function createSpace () {
        CreateSpace.showDialog();
      }

      function addContentType (data) {
        trackClickedButton(data.cta);
        $state.go('spaces.detail.content_types.new.home');
      }

      function addEntry (data) {
        trackClickedButton(data.cta);
        var contentTypes = spaceContext.publishedContentTypes;
        if (contentTypes.length === 1) {
          var entityCreationController = $controller('EntityCreationController');
          entityCreationController.newEntry(contentTypes[0]);
        } else {
          $state.go('spaces.detail.entries.list');
        }
      }

      // Clicking `Use the API` goes to the delivery API key if there is exactly
      // one otherwise API home
      function goToApiKeySection (data) {
        trackClickedButton(data.cta);
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
      }

      function goToSettings (page) {
        return function (data) {
          trackClickedButton(data.cta);
          $state.go('spaces.detail.settings.' + page + '.list');
        };
      }

      function trackClickedButton (name) {
        analytics.track('learn:step_clicked', {linkName: name});
      }
    }],
    controllerAs: 'onboarding'
  };
}]);
