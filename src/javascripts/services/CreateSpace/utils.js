import createResourceService from 'services/ResourceService';
import client from 'services/client';
import * as TokenStore from 'services/TokenStore';
import _ from 'lodash';
import * as Analytics from 'analytics/Analytics';
import * as Navigator from 'states/Navigator';
import { getApiKeyRepo } from 'features/api-keys-management';
import { getTemplate } from 'services/SpaceTemplateLoader';
import * as spaceTemplateCreator from 'services/SpaceTemplateCreator';
import * as logger from 'services/logger';
import { Notification } from '@contentful/forma-36-react-components';

const DEFAULT_ERROR_MESSAGE =
  'Could not create Space. If the problem persists please get in contact with us.';

function hasErrorOnField(errors, fieldPath, errorName) {
  return _.some(errors, (e) => e.path === fieldPath && e.name === errorName);
}

const handleSpaceCreation = (
  spaceContext,
  newSpace,
  template,
  selectedLocale,
  onCloseCreationDialog,
  setTemplateProgress,
  setCreationFinished
) => {
  const templateName = _.get(template, 'name');

  Navigator.go({
    path: 'spaces.detail',
    params: {
      spaceId: newSpace.sys.id,
    },
  })
    .then(() => {
      const spaceCreateEventData =
        templateName === 'Blank'
          ? { templateName: templateName }
          : {
              templateName: templateName,
              entityAutomationScope: { scope: 'space_template' },
            };

      Analytics.track('space:create', spaceCreateEventData);

      if (templateName === 'Blank') {
        getApiKeyRepo().create(
          'Example Key',
          'We’ve created an example API key for you to help you get started.'
        );

        onCloseCreationDialog();
      } else {
        setTemplateProgress(true);
        return loadSelectedTemplate(spaceContext, template, selectedLocale);
      }
    })
    .finally(() => {
      setCreationFinished(true);
    });
};

const createNewSpace = (
  data,
  organization,
  spaceContext,
  template,
  onCloseCreationDialog,
  setTemplateProgress,
  setCreationFinished
) => {
  if (!template) {
    template = { name: 'Blank' };
  }

  Analytics.track('space:template_selected', { templateName: template.name });

  const selectedLocale = data.defaultLocale;

  const dataWithUpdatedLocale = Object.assign({}, data, {
    defaultLocale: selectedLocale,
  });

  client
    .createSpace(dataWithUpdatedLocale, organization.sys.id)
    .then((newSpace) => {
      // Create space
      TokenStore.refresh().then(
        _.partial(
          handleSpaceCreation,
          spaceContext,
          newSpace,
          template,
          selectedLocale,
          onCloseCreationDialog,
          setTemplateProgress,
          setCreationFinished
        )
      );
    })
    .catch((error) => {
      const errors = _.get(error, 'body.details.errors');
      const fieldErrors = [
        { name: 'length', path: 'name', message: 'Space name is too long' },
        { name: 'invalid', path: 'default_locale', message: 'Invalid locale' },
      ];

      // If there aren't explicit errors from the response,
      // this means that something went wrong.
      if (!errors || !errors.length) {
        Notification.error(DEFAULT_ERROR_MESSAGE);
        logger.logServerWarn('Could not create Space', { error: error });

        return;
      }

      _.forEach(fieldErrors, (e) => {
        if (hasErrorOnField(errors, e.path, e.name)) {
          Notification.error(e.message);
        }
      });
    });
};

function createTemplate(template, retried, spaceContext, templateCreator) {
  const createTemplatePromises = templateCreator.create(template);

  // we suppress errors, since `contentCreated` will handle them
  // We need to catch all errors, because http requests
  // are backed by $q, and we have global handlers on
  // $q errors
  createTemplatePromises.spaceSetup.catch(() => {});

  return createTemplatePromises.contentCreated
    .catch((data) => {
      if (!retried) {
        createTemplate(data.template, true);
      }
    })
    .then(() => spaceContext.publishedCTs.refresh());
}

function loadSelectedTemplate(spaceContext, selectedTemplate, selectedLocale) {
  const itemHandlers = {
    // no need to show status of individual items
    onItemSuccess: _.noop,
    onItemError: _.noop,
  };

  const templateCreator = spaceTemplateCreator.getCreator(
    spaceContext,
    itemHandlers,
    selectedTemplate,
    selectedLocale
  );
  return getTemplate(selectedTemplate).then((template, retried) =>
    createTemplate(template, retried, spaceContext, templateCreator)
  );
}

export const requestSpaceCreation = (
  data,
  organization,
  spaceContext,
  template,
  onCloseCreationDialog,
  setTemplateProgress,
  setCreationFinished
) => {
  const resources = createResourceService(organization.sys.id, 'organization');

  // First check that there are resources available
  // to create the space
  resources
    .canCreate('space')
    .then((canCreate) => {
      if (canCreate) {
        // Resources are available. Attempt to create a new space
        createNewSpace(
          data,
          organization,
          spaceContext,
          template,
          onCloseCreationDialog,
          setTemplateProgress,
          setCreationFinished
        );
      } else {
        resources.messagesFor('space').then((errorObj) => {
          Notification.error(errorObj.error);
        });
      }
    })
    .catch((error) => {
      Notification.error(DEFAULT_ERROR_MESSAGE);
      logger.logServerWarn('Could not fetch permissions', { error: error });
    });
};
