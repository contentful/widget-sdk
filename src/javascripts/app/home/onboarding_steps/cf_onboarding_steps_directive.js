'use strict';

angular.module('contentful')
.directive('cfOnboardingSteps', ['require', function (require) {
  const $state = require('$state');
  const Analytics = require('analytics/Analytics');
  const spaceContext = require('spaceContext');
  const WebhookRepository = require('WebhookRepository');
  const CreateSpace = require('services/CreateSpace');
  const caseofEq = require('sum-types').caseofEq;
  const TheLocaleStore = require('TheLocaleStore');
  const entityCreator = require('entityCreator');
  const LD = require('utils/LaunchDarkly');
  const K = require('utils/kefir');
  const modernStackOnboardingFlag = 'feature-dl-05-2018-modern-stack-onboarding';
  const store = require('TheStore').getStore();
  const { isExampleSpace } = require('data/ContentPreview');
  const { getAll: getAllContentPreviews } = require('contentPreview');
  const { user$, getOrganizations } = require('services/TokenStore');
  const { default: template } = require('app/home/onboarding_steps/OnboardingStepsTemplate');

  return {
    template: template(),
    restrict: 'E',
    scope: {},
    controller: ['$scope', function ($scope) {
      const controller = this;

      const updateModernStackOnboardingFlags = flag => {
        const user = K.getValue(user$);
        const prefix = `ctfl:${user.sys.id}:modernStackOnboarding`;
        const msDevChoiceSpace = store.get(`${prefix}:developerChoiceSpace`);
        const msContentChoiceSpace = store.get(`${prefix}:contentChoiceSpace`);
        const spaceAutoCreationFailed = store.get(`ctfl:${user.sys.id}:spaceAutoCreationFailed`);

        const currentSpaceId = spaceContext.space && spaceContext.space.getSys().id;

        controller.showModernStackDevChoiceNextSteps =
          flag &&
          !spaceAutoCreationFailed &&
          currentSpaceId &&
          currentSpaceId === msDevChoiceSpace;

        controller.showModernStackContentChoiceNextSteps =
          flag &&
          !spaceAutoCreationFailed &&
          currentSpaceId &&
          currentSpaceId === msContentChoiceSpace;
      };

      // delay execution of a fn that returns a promise by `ms` milliseconds
      const delay = (fn, ms) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            fn().then(resolve, reject);
          }, ms);
        });
      };

      const updateIsTEASpaceFlag = async (delayMs = 0) => {
        controller.isTEASpace = false;
        controller.isContentPreviewsLoading = true;

        try {
          // delaying function call by a few ms to let the api response
          // be consistent. Without the delay, this returns previews at times
          // and not at other times. This should even that behaviour out.
          const previews = await delay(getAllContentPreviews, delayMs);
          const publishedCTs = K.getValue(spaceContext.publishedCTs.items$);

          controller.isTEASpace = isExampleSpace(previews, publishedCTs);
        } finally {
          controller.isContentPreviewsLoading = false;
        }
      };

      // update all flags once the emtpy space is loaded with the selected template
      $scope.$on('spaceTemplateCreated', async () => {
        updateModernStackOnboardingFlags(await LD.getCurrentVariation(modernStackOnboardingFlag));
        // wait for two seconds before requesting the content previews to account for eventual
        // consistency on the CMA
        await updateIsTEASpaceFlag(2000);
      });

      LD.onFeatureFlag($scope, modernStackOnboardingFlag, updateModernStackOnboardingFlags);

      if (spaceContext.space) {
        updateIsTEASpaceFlag();
      }

      var firstSteps = [
        {
          id: 'create_space',
          title: 'Create a space',
          description: 'A space is a place where you keep all the content related to a single project.',
          cta: 'Create space',
          icon: 'space',
          action: makeAction(createNewSpace, 'Create space')
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
        return () => {
          Analytics.track('learn:step_clicked', {linkName: cta});
          action();
        };
      }

      caseofEq($state.current.name, [
        ['home', initHomePage],
        ['spaces.detail.home', () => {
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
          spaceContext.space.getEntries().then(entries => {
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
        firstSteps.forEach((step, i) => {
          step.disabled = false;
          step.completed = i < nextStepIdx;

          if (i > nextStepIdx) {
            step.disabled = true;
          }
        });
      }

      function setAdvancedStepsCompletion () {
        advancedSteps[1].completed = TheLocaleStore.getLocales().length > 1;

        spaceContext.endpoint({
          method: 'GET',
          path: ['users']
        }).then(res => {
          controller.steps[0].completed = res.items.length > 1;
        });

        WebhookRepository.getInstance(spaceContext.space).getAll()
        .then(webhooks => {
          controller.steps[2].completed = webhooks.length > 0;
        });
      }

      function addContentType () {
        $state.go('spaces.detail.content_types.new');
      }

      function addEntry () {
        var contentTypes = spaceContext.publishedCTs.getAllBare();

        if (contentTypes.length === 1) {
          var contentTypeId = contentTypes[0].sys.id;
          var contentType = spaceContext.publishedCTs.get(contentTypeId);
          entityCreator.newEntry(contentTypeId)
            .then(entry => {
              Analytics.track('entry:create', {
                eventOrigin: 'onboarding',
                contentType: contentType,
                response: entry
              });
              $state.go('spaces.detail.entries.detail', {entryId: entry.getId()});
            });
        } else {
          $state.go('spaces.detail.entries.list');
        }
      }

      // Clicking `Use the API` goes to the delivery API key if there is exactly
      // one otherwise API home
      function goToApiKeySection () {
        spaceContext.apiKeyRepo.getAll()
        .then(keys => {
          if (keys.length === 1) {
            var name = 'spaces.detail.api.keys.detail';
            var params = { apiKeyId: keys[0].sys.id };
            $state.go(name, params);
          } else {
            $state.go('spaces.detail.api.keys.list');
          }
        });
      }

      function goToSettings (page) {
        return () => {
          $state.go('spaces.detail.settings.' + page + '.list');
        };
      }

      // This function is called when the user has no spaces in the current org.
      // For this reason we get the id of the first org the user has access to.
      function createNewSpace () {
        getOrganizations()
          .then(orgs => orgs[0].sys.id)
          .then(id => {
            CreateSpace.showDialog(id);
          });
      }
    }],
    controllerAs: 'onboarding'
  };
}]);
