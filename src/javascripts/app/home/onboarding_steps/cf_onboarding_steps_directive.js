import { name as CreateModernOnboardingModule } from '../../../components/shared/auto_create_new_space/CreateModernOnboarding';

angular.module('contentful').directive('cfOnboardingSteps', [
  'require',
  function(require) {
    const _ = require('lodash');
    const $state = require('$state');
    const Analytics = require('analytics/Analytics.es6');
    const spaceContext = require('spaceContext');
    const CreateSpace = require('services/CreateSpace.es6');
    const caseofEq = require('sum-types').caseofEq;
    const entityCreator = require('entityCreator');
    const LD = require('utils/LaunchDarkly');
    const K = require('utils/kefir.es6');
    const store = require('TheStore').getStore();
    const { isExampleSpace } = require('data/ContentPreview');
    const { getAll: getAllContentPreviews } = require('contentPreview');
    const { getOrganizations } = require('services/TokenStore.es6');
    const { default: template } = require('app/home/onboarding_steps/OnboardingStepsTemplate.es6');
    const { getKey: getSpaceAutoCreatedKey } = require('components/shared/auto_create_new_space');
    const {
      getStoragePrefix: getModernStackStoragePrefix,
      getCredentials,
      getUser,
      getPerson,
      isDevOnboardingSpace,
      isContentOnboardingSpace,
      MODERN_STACK_ONBOARDING_FEATURE_FLAG
    } = require(CreateModernOnboardingModule);

    return {
      template: template(),
      restrict: 'E',
      scope: {},
      controller: [
        '$scope',
        function($scope) {
          const controller = this;

          controller.shouldShowTEANextSteps = () =>
            controller.showModernStackContentChoiceNextSteps ||
            (controller.isModernStackOnboardingFeatureEnabled && controller.isTEASpace);

          controller.shouldShowGenericNextSteps = () =>
            !controller.showModernStackDevChoiceNextSteps && !controller.shouldShowTEANextSteps();

          function setSaneModernStackOnboardingDefaults(msDevChoiceKey, currentStepKey, spaceId) {
            // store the modern stack onboarding space that was created for the dev choice
            store.set(msDevChoiceKey, spaceId);

            const currentStep = store.get(currentStepKey);

            if (!currentStep) {
              store.set(currentStepKey, {
                path: 'spaces.detail.onboarding.getStarted',
                params: {
                  spaceId
                }
              });
            }
            // mark auto space creation as succeeded since space with
            // modern stack onboarding name exists
            store.set(getSpaceAutoCreatedKey(getUser(), 'success'), true);
          }

          async function updateModernStackOnboardingData(flag) {
            const prefix = getModernStackStoragePrefix();
            const msDevChoiceKey = `${prefix}:developerChoiceSpace`;

            const msDevChoiceSpace = store.get(msDevChoiceKey);
            const spaceAutoCreationFailed = store.get(getSpaceAutoCreatedKey(getUser(), 'failure'));

            const currentSpaceId = spaceContext.space && spaceContext.space.getSys().id;

            const showModernStackDevChoiceNextSteps =
              flag && !spaceAutoCreationFailed && isDevOnboardingSpace(spaceContext.space);

            controller.showModernStackContentChoiceNextSteps =
              flag && !spaceAutoCreationFailed && isContentOnboardingSpace(spaceContext.space);

            if (showModernStackDevChoiceNextSteps) {
              const currentStepKey = `${prefix}:currentStep`;

              // If we are to show modern stack onboarding but none of the
              // required data was found in localStorage, like when the user
              // uses a new browser, set some sane defaults
              if (!msDevChoiceSpace || !store.get(currentStepKey)) {
                setSaneModernStackOnboardingDefaults(
                  msDevChoiceKey,
                  currentStepKey,
                  currentSpaceId
                );
              }

              const {
                showModernStackDevChoiceNextSteps,
                msDevChoiceNextStepsData
              } = await getModernStackOnboardingDevChoiceData(currentSpaceId);

              // add data required for modern stack onboarding to the controller
              controller.showModernStackDevChoiceNextSteps = showModernStackDevChoiceNextSteps;
              controller.msDevChoiceNextStepsData = msDevChoiceNextStepsData;
            }
          }

          async function getModernStackOnboardingDevChoiceData(spaceId) {
            let msDevChoiceNextStepsData = {};
            let showModernStackDevChoiceNextSteps = true;
            const isModernStackOnboardingComplete = store.get(
              `${getModernStackStoragePrefix()}:completed`
            );

            if (isModernStackOnboardingComplete) {
              const [{ managementToken }, personEntry] = await Promise.all([
                getCredentials(),
                getPerson()
              ]);
              if (!personEntry) {
                // if the person entry wasn't found, don't show next steps for dev
                // choice in the modern stack onboarding
                showModernStackDevChoiceNextSteps = false;
              } else {
                showModernStackDevChoiceNextSteps = true;
                msDevChoiceNextStepsData = {
                  managementToken,
                  entry: personEntry,
                  spaceId
                };
              }
            }

            return {
              showModernStackDevChoiceNextSteps,
              msDevChoiceNextStepsData
            };
          }

          // delay execution of a fn that returns a promise by `ms` milliseconds
          const delay = (fn, ms) => new Promise(resolve => setTimeout(resolve, ms)).then(fn);

          async function updateNextStepsState(delayMs = 0) {
            controller.isTEASpace = false;
            controller.isContentPreviewsLoading = true;

            try {
              const publishedCTs = K.getValue(spaceContext.publishedCTs.items$);
              // delaying function call by a few ms to let the api response
              // be consistent. Without the delay, this returns previews at times
              // and not at other times. This should even that behaviour out.
              const previewsPromise = delay(getAllContentPreviews, delayMs);
              const modernStackVariationPromise = LD.getCurrentVariation(
                MODERN_STACK_ONBOARDING_FEATURE_FLAG
              );
              const [previews, modernStackOnboarding] = await Promise.all([
                previewsPromise,
                modernStackVariationPromise
              ]);

              await updateModernStackOnboardingData(modernStackOnboarding);

              controller.isTEASpace = isExampleSpace(previews, publishedCTs);
            } finally {
              controller.isContentPreviewsLoading = false;
            }
          }

          // update all flags once the empty space is loaded with the selected template
          $scope.$on('spaceTemplateCreated', async () => {
            // wait for three seconds before requesting the content previews to account for eventual
            // consistency on the CMA
            updateNextStepsState(3000);
          });

          LD.onFeatureFlag($scope, MODERN_STACK_ONBOARDING_FEATURE_FLAG, flag => {
            controller.isModernStackOnboardingFeatureEnabled = flag;

            if (spaceContext.space) {
              updateModernStackOnboardingData(flag);
            }
          });

          if (spaceContext.space) {
            updateNextStepsState();
          }

          const firstSteps = [
            {
              id: 'create_space',
              title: 'Create a space',
              description:
                'A space is a place where you keep all the content related to a single project.',
              cta: 'Create space',
              icon: 'space',
              action: makeAction(createNewSpace, 'Create space')
            },
            {
              id: 'create_content_type',
              title: 'Define the structure',
              description:
                'Create your content model. It’s comprised of content types, which define the structure of your entries.',
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
              description:
                'Add an entry. They are your actual pieces of content, based on the content types you have created.',
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
              description:
                'Use the API to see your content wherever you like. We’ll show you different ways of delivering your content.',
              cta: 'Use the API',
              icon: 'page-apis',
              action: makeAction(goToApiKeySection, 'Use the API')
            }
          ];

          const advancedSteps = [
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
              description:
                'Configure webhooks to send requests triggered by changes to your content.',
              cta: 'Add webhooks',
              icon: 'onboarding-webhooks',
              link: {
                text: 'View webhooks',
                state: 'spaces.detail.settings.webhooks.list'
              },
              action: makeAction(goToSettings('webhooks'), 'Add webhooks')
            }
          ];

          function makeAction(action, cta) {
            return function() {
              Analytics.track('learn:step_clicked', { linkName: cta });
              action();
            };
          }

          caseofEq($state.current.name, [
            ['home', initHomePage],
            [
              'spaces.detail.home',
              function() {
                initSpaceHomePage();
                // Refresh after new space creation as content types and entries might have been created
                $scope.$on('spaceTemplateCreated', initSpaceHomePage);
              }
            ]
          ]);

          function initHomePage() {
            controller.steps = firstSteps;
            setStepCompletion(0);
          }

          function initSpaceHomePage() {
            const hasContentTypes = spaceContext.publishedCTs.getAllBare().length > 0;
            const isActivated = !!spaceContext.getData('activatedAt');
            const showAdvancedSteps = isActivated && hasContentTypes;

            if (showAdvancedSteps) {
              controller.steps = advancedSteps;
              setAdvancedStepsCompletion();
            } else {
              controller.steps = firstSteps;
              setOnboardingStepsCompletion();
            }
          }

          function setOnboardingStepsCompletion() {
            const hasContentTypes = spaceContext.publishedCTs.getAllBare().length > 0;

            if (hasContentTypes) {
              spaceContext.space.getEntries().then(function(entries) {
                const hasEntries = !!_.size(entries);
                const nextStep = hasEntries ? 3 : 2;
                setStepCompletion(nextStep);
              });
            } else {
              setStepCompletion(1);
            }
          }

          function setStepCompletion(nextStepIdx) {
            // Set previous steps to completed and disable future steps
            // This is for the first page only
            firstSteps.forEach(function(step, i) {
              step.disabled = false;
              step.completed = i < nextStepIdx;

              if (i > nextStepIdx) {
                step.disabled = true;
              }
            });
          }

          function setAdvancedStepsCompletion() {
            spaceContext.localeRepo.getAll().then(locales => {
              controller.steps[1].completed = locales.length > 1;
            });

            spaceContext
              .endpoint({
                method: 'GET',
                path: ['users']
              })
              .then(function(res) {
                controller.steps[0].completed = res.items.length > 1;
              });

            spaceContext.webhookRepo.getAll().then(function(webhooks) {
              controller.steps[2].completed = webhooks.length > 0;
            });
          }

          function addContentType() {
            $state.go('spaces.detail.content_types.new');
          }

          function addEntry() {
            const contentTypes = spaceContext.publishedCTs.getAllBare();

            if (contentTypes.length === 1) {
              const contentTypeId = contentTypes[0].sys.id;
              const contentType = spaceContext.publishedCTs.get(contentTypeId);
              entityCreator.newEntry(contentTypeId).then(function(entry) {
                Analytics.track('entry:create', {
                  eventOrigin: 'onboarding',
                  contentType: contentType,
                  response: entry
                });
                $state.go('spaces.detail.entries.detail', { entryId: entry.getId() });
              });
            } else {
              $state.go('spaces.detail.entries.list');
            }
          }

          // Clicking `Use the API` goes to the delivery API key if there is exactly
          // one otherwise API home
          function goToApiKeySection() {
            spaceContext.apiKeyRepo.getAll().then(function(keys) {
              if (keys.length === 1) {
                const name = 'spaces.detail.api.keys.detail';
                const params = { apiKeyId: keys[0].sys.id };
                $state.go(name, params);
              } else {
                $state.go('spaces.detail.api.keys.list');
              }
            });
          }

          function goToSettings(page) {
            return function() {
              $state.go('spaces.detail.settings.' + page + '.list');
            };
          }

          // This function is called when the user has no spaces in the current org.
          // For this reason we get the id of the first org the user has access to.
          function createNewSpace() {
            getOrganizations()
              .then(function(orgs) {
                return orgs[0].sys.id;
              })
              .then(function(id) {
                CreateSpace.showDialog(id);
              });
          }
        }
      ],
      controllerAs: 'onboarding'
    };
  }
]);
