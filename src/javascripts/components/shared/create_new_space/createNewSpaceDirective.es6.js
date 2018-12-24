import { registerDirective, registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import React from 'react';
import createNewSpaceTemplateDef from 'components/shared/create_new_space/Template.es6';

registerDirective('cfCreateNewSpace', () => ({
  restrict: 'E',
  template: createNewSpaceTemplateDef(),
  controller: 'createSpaceController',
  controllerAs: 'createSpace'
}));

registerController('createSpaceController', [
  '$scope',
  '$rootScope',
  '$state',
  '$element',
  'spaceContext',
  'client',
  'logger',
  'localesList',
  'services/TokenStore.es6',
  'access_control/Enforcements.es6',
  'analytics/Analytics.es6',
  'services/SpaceTemplateCreator/index.es6',
  'analytics/events/SpaceCreation.es6',
  'services/SpaceTemplateLoader.es6',
  'services/ResourceService.es6',
  function(
    $scope,
    $rootScope,
    $state,
    $element,
    spaceContext,
    client,
    logger,
    localesList,
    TokenStore,
    enforcements,
    Analytics,
    spaceTemplateCreator,
    spaceTemplateEvents,
    { getTemplatesList, getTemplate },
    { default: createResourceService }
  ) {
    const controller = this;
    const DEFAULT_LOCALE = 'en-US';
    const DEFAULT_ERROR_MESSAGE =
      'Could not create Space. If the problem persists please get in contact with us.';

    // Keep track of the view state
    controller.viewState = 'createSpaceForm';

    // Set new space defaults
    controller.newSpace = {
      data: {
        defaultLocale: DEFAULT_LOCALE
      },
      useTemplate: false,
      errors: { fields: {} }
    };

    controller.newSpace.organization = $scope.organization;

    // Load the list of space templates
    controller.templates = [];
    getTemplatesList()
      .then(setupTemplates)
      .catch(() => {
        controller.templates = undefined;
      });

    // Populate locales
    controller.localesList = _.map(localesList, locale => ({
      displayName: locale.name + ' (' + locale.code + ')',
      code: locale.code
    }));

    // Scroll to bottom if example templates are opened and templates loaded
    $scope.$watch(
      () => controller.newSpace.useTemplate,
      usingTemplate => {
        if (usingTemplate && controller.templates) {
          $element.animate({ scrollTop: $element.scrollTop() + 260 }, 'linear');
        }
      }
    );

    // Switch space template
    controller.selectTemplate = template => {
      if (!controller.createSpaceInProgress) {
        controller.newSpace.selectedTemplate = template;
      }
    };

    // Request space creation
    controller.requestSpaceCreation = () => {
      const organization = controller.newSpace.organization;

      const resources = createResourceService(organization.sys.id, 'organization');

      // First check that there are resources available
      // to create the space
      resources
        .canCreate('space')
        .then(canCreate => {
          if (canCreate) {
            // Resources are available. Attempt to create a new space
            createNewSpace();
          } else {
            resources.messagesFor('space').then(errorObj => {
              handleUsageWarning(errorObj.error);
            });
          }
        })
        .catch(error => {
          showFormError(DEFAULT_ERROR_MESSAGE);
          logger.logServerWarn('Could not fetch permissions', { error: error });
        });
    };

    controller.buildLanguageSelectProps = () => ({
      labelText: 'Language',
      name: 'language-select',
      value: controller.newSpace.data.defaultLocale,
      validationMessage: controller.newSpace.errors.fields.default_locale,
      children: controller.localesList.map(locale => (
        <option key={locale.code} value={locale.code}>
          {locale.displayName}
        </option>
      )),
      testId: 'select-locale',
      id: 'newspace-language',
      onChange: e => {
        controller.newSpace.data.defaultLocale = e.target.value;
      },
      selectProps: {
        isDisabled: controller.createSpaceInProgress
      }
    });

    controller.buildSpaceNameInputProps = () => ({
      labelText: 'Space name',
      id: 'newspace-name',
      name: 'newspace-name',
      validationMessage: controller.newSpace.errors.fields.name,
      value: controller.newSpace.data.name || '',
      required: true,
      onChange: e => {
        controller.newSpace.data.name = e.target.value;
      },
      textInputProps: {
        disabled: controller.createSpaceInProgress
      }
    });

    function setupTemplates(templates) {
      // Don't need this once the `Blank` template gets removed from Contentful
      controller.templates = _.reduce(
        templates,
        (acc, template) => {
          if (!template.fields.blank) {
            const fields = template.fields;
            acc.push(fields);
          }
          return acc;
        },
        []
      );

      // Select default template
      controller.newSpace.selectedTemplate = _.first(controller.templates);
    }

    function validate(data) {
      const hasSpaceName = data.name && data.name.length;
      if (!hasSpaceName) {
        showFormError('Please provide space name');
      }
      return hasSpaceName;
    }

    function createNewSpace() {
      const data = controller.newSpace.data;
      const organization = controller.newSpace.organization;
      let template = null;

      if (!validate(data)) {
        return;
      }

      if (organization.pricingVersion === 'pricing_version_2' && !data.productRatePlanId) {
        return showFormError('You must select a rate plan.');
      }

      if (controller.newSpace.useTemplate) {
        template = controller.newSpace.selectedTemplate;
      } else {
        template = { name: 'Blank' };
      }

      controller.createSpaceInProgress = true;

      Analytics.track('space:template_selected', { templateName: template.name });

      // if we use a template, we want to use DEFAULT_LOCALE
      const selectedLocale =
        controller.newSpace.useTemplate === true ? DEFAULT_LOCALE : data.defaultLocale;
      const dataWithUpdatedLocale = Object.assign({}, data, {
        defaultLocale: selectedLocale
      });

      client
        .createSpace(dataWithUpdatedLocale, organization.sys.id)
        .then(newSpace => {
          // Create space
          TokenStore.refresh().then(_.partial(handleSpaceCreation, newSpace, template));
        })
        .catch(error => {
          const errors = _.get(error, 'body.details.errors');
          const fieldErrors = [
            { name: 'length', path: 'name', message: 'Space name is too long' },
            { name: 'invalid', path: 'default_locale', message: 'Invalid locale' }
          ];

          // If there aren't explicit errors from the response,
          // this means that something went wrong.
          if (!errors || !errors.length) {
            showFormError(DEFAULT_ERROR_MESSAGE);
            logger.logServerWarn('Could not create Space', { error: error });

            return;
          }

          _.forEach(fieldErrors, e => {
            if (hasErrorOnField(errors, e.path, e.name)) {
              showFieldError(e.path, e.message);
            }
          });
        });
    }

    function handleSpaceCreation(newSpace, template) {
      const templateName = _.get(template, 'name');

      $state
        .go('spaces.detail', { spaceId: newSpace.sys.id })
        .then(() => {
          const spaceCreateEventData =
            templateName === 'Blank'
              ? { templateName: templateName }
              : { templateName: templateName, entityAutomationScope: { scope: 'space_template' } };

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

    function createTemplate(template, retried) {
      const createTemplatePromises = controller.templateCreator.create(template);

      // we suppress errors, since `contentCreated` will handle them
      // We need to catch all errors, because http requests
      // are backed by $q, and we have global handlers on
      // $q errors
      createTemplatePromises.spaceSetup.catch(() => {});

      return createTemplatePromises.contentCreated
        .catch(data => {
          if (!retried) {
            createTemplate(data.template, true);
          }
        })
        .then(() => spaceContext.publishedCTs.refresh())
        .then(() => {
          // Picked up by the learn page which then refreshes itself
          $rootScope.$broadcast('spaceTemplateCreated');
        });
    }

    function loadSelectedTemplate() {
      const itemHandlers = {
        // no need to show status of individual items
        onItemSuccess: function(entityId, entityData, templateName) {
          spaceTemplateEvents.entityActionSuccess(
            entityId,
            Object.assign({}, entityData, { entityAutomationScope: { scope: 'space_template' } }),
            templateName
          );
        },
        onItemError: _.noop
      };

      const selectedTemplate = controller.newSpace.selectedTemplate;
      const selectedLocale =
        controller.newSpace.useTemplate === true
          ? DEFAULT_LOCALE
          : controller.newSpace.data.defaultLocale;

      controller.templateCreator = spaceTemplateCreator.getCreator(
        spaceContext,
        itemHandlers,
        selectedTemplate,
        selectedLocale
      );
      return getTemplate(selectedTemplate).then(createTemplate);
    }

    // Form validations
    function hasErrorOnField(errors, fieldPath, errorName) {
      return _.some(errors, e => e.path === fieldPath && e.name === errorName);
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
      const enforcement = enforcements.determineEnforcement(
        spaceContext.space,
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
  }
]);
