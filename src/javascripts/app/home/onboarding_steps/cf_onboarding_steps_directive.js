'use strict';

angular.module('contentful')
.directive('cfOnboardingSteps', ['require', function (require) {
  var $state = require('$state');
  var $controller = require('$controller');
  var Analytics = require('analytics/Analytics');
  var template = require('app/home/onboarding_steps/OnboardingStepsTemplate').default;
  var spaceContext = require('spaceContext');
  var WebhookRepository = require('WebhookRepository');
  var CreateSpace = require('services/CreateSpace');
  var caseofEq = require('libs/sum-types').caseofEq;

  return {
    template: template(),
    restrict: 'E',
    scope: {},
    controller: ['$scope', function ($scope) {
      var controller = this;

      var firstSteps = [
        {
          id: 'create_space',
          title: 'Create a space',
          description: 'A space is a place where you keep all the content related to a single project.',
          cta: 'Create space',
          icon: 'space',
          action: makeAction(CreateSpace.showDialog, 'Create space')
        },
        {
          id: 'create_content_type',
          title: 'Define the structure',
          description: 'Create your content model. It’s comprised of content types, which define the structure of your entries.',
          cta: 'Create a content type',
          icon: 'page-ct',
          link: {
            text: 'View content model',
            state: 'spaces.detail.content_types.list'
          },
          action: makeAction(addContentType, 'Create a content type')
        },
        {
          id: 'create_entry',
          title: 'Create your content',
          description: 'Add an entry. They are your actual pieces of content, based on the content types you have created.',
          cta: 'Add an entry',
          icon: 'page-content',
          link: {
            text: 'View content',
            state: 'spaces.detail.entries.list'
          },
          action: makeAction(addEntry, 'Add an entry')
        },
        {
          id: 'use_api',
          title: 'Fetch your content',
          description: 'Use the API to see your content wherever you like. We’ll show you different ways of delivering your content.',
          cta: 'Use the API',
          icon: 'page-apis',
          action: makeAction(goToApiKeySection, 'Use the API')
        }
      ];

      var advancedSteps = [
        {
          id: 'invite_user',
          title: 'Invite users',
          description: 'Invite your teammates to the space to get your project off the ground.',
          cta: 'Invite users',
          icon: 'onboarding-add-user',
          link: {
            text: 'View users',
            state: 'spaces.detail.settings.users.list'
          },
          action: makeAction(goToSettings('users'), 'Invite users')
        },
        {
          id: 'add_locale',
          title: 'Locales',
          description: 'Set up locales to manage and deliver content in different languages.',
          cta: 'Add locales',
          icon: 'onboarding-locales',
          link: {
            text: 'View locales',
            state: 'spaces.detail.settings.locales.list'
          },
          action: makeAction(goToSettings('locales'), 'Add locales')
        },
        {
          id: 'create_webhook',
          title: 'Webhooks',
          description: 'Configure webhooks to send requests triggered by changes to your content.',
          cta: 'Add webhooks',
          icon: 'onboarding-webhooks',
          link: {
            text: 'View webhooks',
            state: 'spaces.detail.settings.webhooks.list'
          },
          action: makeAction(goToSettings('webhooks'), 'Add webhooks')
        }
      ];

      function makeAction (action, cta) {
        return function () {
          Analytics.track('learn:step_clicked', {linkName: cta});
          action();
        };
      }

      caseofEq($state.current.name, [
        ['home', initHomePage],
        ['spaces.detail.home', function () {
          initSpaceHomePage();
          // Refresh after new space creation as content types and entries might have been created
          $scope.$on('spaceTemplateCreated', initSpaceHomePage);
        }]
      ]);

      function initHomePage () {
        controller.steps = firstSteps;
        setStepCompletion(0);
      }

      function initSpaceHomePage () {
        var hasContentTypes = spaceContext.publishedCTs.getAllBare().length > 0;
        var isActivated = !!spaceContext.getData('activatedAt');
        var showAdvancedSteps = isActivated && hasContentTypes;

        if (showAdvancedSteps) {
          controller.steps = advancedSteps;
          setAdvancedStepsCompletion();
        } else {
          controller.steps = firstSteps;
          setOnboardingStepsCompletion();
        }
      }

      function setOnboardingStepsCompletion () {
        var hasContentTypes = spaceContext.publishedCTs.getAllBare().length > 0;

        if (hasContentTypes) {
          spaceContext.space.getEntries().then(function (entries) {
            var hasEntries = !!_.size(entries);
            var nextStep = hasEntries ? 3 : 2;
            setStepCompletion(nextStep);
          });
        } else {
          setStepCompletion(1);
        }
      }

      function setStepCompletion (nextStepIdx) {
        // Set previous steps to completed and disable future steps
        // This is for the first page only
        firstSteps.forEach(function (step, i) {
          step.disabled = false;
          step.completed = i < nextStepIdx;

          if (i > nextStepIdx) {
            step.disabled = true;
          }
        });
      }

      function setAdvancedStepsCompletion () {
        var hasLocales = spaceContext.getData('locales').length > 1;
        advancedSteps[1].completed = hasLocales;

        spaceContext.endpoint({
          method: 'GET',
          path: ['users']
        }).then(function (res) {
          controller.steps[0].completed = res.items.length > 1;
        });

        WebhookRepository.getInstance(spaceContext.space).getAll()
        .then(function (webhooks) {
          controller.steps[2].completed = webhooks.length > 0;
        });
      }

      function addContentType () {
        $state.go('spaces.detail.content_types.new');
      }

      function addEntry () {
        var contentTypes = spaceContext.publishedCTs.getAllBare();

        if (contentTypes.length === 1) {
          var entityCreationController = $controller('EntityCreationController');
          entityCreationController.newEntry(contentTypes[0].sys.id);
        } else {
          $state.go('spaces.detail.entries.list');
        }
      }

      // Clicking `Use the API` goes to the delivery API key if there is exactly
      // one otherwise API home
      function goToApiKeySection () {
        spaceContext.apiKeyRepo.getAll()
        .then(function (keys) {
          if (keys.length === 1) {
            var name = 'spaces.detail.api.keys.detail';
            var params = { apiKeyId: keys[0].sys.id };
            $state.go(name, params);
          } else {
            $state.go('spaces.detail.api.home');
          }
        });
      }

      function goToSettings (page) {
        return function () {
          $state.go('spaces.detail.settings.' + page + '.list');
        };
      }
    }],
    controllerAs: 'onboarding'
  };
}]);
