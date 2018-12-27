import { runTask } from 'utils/Concurrent.es6';

import { getCreator } from 'services/SpaceTemplateCreator/index.es6';
import { track, updateUserInSegment } from 'analytics/Analytics.es6';
import { go as gotoState } from 'states/Navigator.es6';
import { entityActionSuccess } from 'analytics/events/SpaceCreation.es6';
import { find, noop } from 'lodash';
import { getTemplate, getTemplatesList } from 'services/SpaceTemplateLoader.es6';
import autoCreateSpaceTemplate from './Template.es6';
import * as TokenStore from 'services/TokenStore.es6';
import { getModule } from 'NgRegistry.es6';

const client = getModule('client');
const $rootScope = getModule('$rootScope');
const spaceContext = getModule('spaceContext');
const modalDialog = getModule('modalDialog');
const $state = getModule('$state');
const logger = getModule('logger');

const DEFAULT_LOCALE = 'en-US';

/**
 * @description
 * Creates a sample space using the given template in the
 * given org.
 *
 * @param {object} org
 * @param {string} templateName
 * @param {Function} modalTemplate - template used by the modal dialog service
 *
 * @returns Promise<undefined>
 */
export default function(org, templateName, modalTemplate = autoCreateSpaceTemplate) {
  /*
   * throws an error synchronously to differentiate it from
   * a rejected promise as a rejected promise stands for
   * something going wrong during space creation
   * while this stands for a programmer error
   */
  if (!org) {
    throw new Error('Required param org not provided');
  }

  if (!templateName) {
    throw new Error('Required param templateName not provided');
  }

  // to measure how long it took to fail
  const startingMoment = Date.now();

  const scope = $rootScope.$new();
  return runTask(function*() {
    let dialog = null;

    // TODO: Remove after feature-ps-11-2017-project-status
    // is turned off. It only exists to track clicks and
    // enable us to have two independent "screens" inside
    // the modal
    if (modalTemplate !== autoCreateSpaceTemplate) {
      scope.onProjectStatusSelect = elementId => {
        track('element:click', {
          elementId,
          groupId: 'project_status',
          fromState: $state.current.name
        });
        updateUserInSegment({
          projectStatus: elementId
        });
        // this is used to goto the next screen _in_ the modal itself
        scope.chosenProjectStatus = elementId;
        // hacky way to recenter the modal once it's resized
        setTimeout(_ => dialog._centerOnBackground(), 0);
      };
    }

    scope.isCreatingSpace = true;
    dialog = openDialog(scope, templateName, modalTemplate);
    const template = yield* loadTemplate(templateName);
    let newSpace;

    try {
      newSpace = yield* createSpace(org, template.name);
      yield* applyTemplate(spaceContext, template);
      yield spaceContext.publishedCTs.refresh();
      $rootScope.$broadcast('spaceTemplateCreated');
      // TODO: Handle error when space creation fails
      // Right now, we just show the green check marking
      // space creation as successful irrespective
    } catch (e) {
      // send error to bugsnag, so we can actually evaluate
      // the impact of failures
      logger.logException(e, {
        data: {
          // which template we were trying to create
          template: templateName,
          // how long did it take to end up here
          runningTime: Date.now() - startingMoment
        },
        groupingHash: 'Failed sample space creation'
      });

      throw e;
    } finally {
      scope.isCreatingSpace = false;
    }

    return newSpace;
  });
}

/**
 * Create a new space in the given org, reload the token and go to the
 * space home.
 */
function* createSpace(org, templateName) {
  const newSpace = yield client.createSpace(
    {
      name: 'The example project',
      defaultLocale: DEFAULT_LOCALE
    },
    org.sys.id
  );

  yield TokenStore.refresh();
  yield gotoState({
    path: ['spaces', 'detail'],
    params: {
      spaceId: newSpace.sys.id
    }
  });
  track('space:create', {
    templateName,
    // mark space as an auto created space
    entityAutomationScope: { scope: 'auto_create' }
  });
  return newSpace;
}

/**
 * Load the space contents for the template info and add it to the
 * current space.
 */
function* applyTemplate(spaceContext, templateInfo) {
  const templateCreator = getCreator(
    spaceContext,
    {
      onItemSuccess: (entityId, entityData, templateName) => {
        entityActionSuccess(
          entityId,
          {
            ...entityData,
            entityAutomationScope: { scope: 'auto_create' }
          },
          templateName
        );
      },
      onItemError: noop
    },
    templateInfo,
    DEFAULT_LOCALE
  );

  const loadedTemplate = yield getTemplate(templateInfo);

  const { contentCreated, spaceSetup } = templateCreator.create(loadedTemplate);

  // supress all errors, since dialog will
  // be closed anyway via `contentCreated` promise
  // We need to catch all errors, because http requests
  // are backed by $q, and we have global handlers on
  // $q errors
  spaceSetup.catch(() => {});

  yield contentCreated;
}

/**
 * Try to load a template with the given name.
 *
 * Throws an error if no template with this name is found.
 */
function* loadTemplate(name) {
  const templates = yield getTemplatesList();
  const template = find(templates, t => t.fields.name.toLowerCase() === name.toLowerCase());

  if (!template) {
    throw new Error(`Template named ${name} not found`);
  } else {
    track('space:template_selected', {
      templateName: template.name
    });

    return template.fields;
  }
}

function openDialog(scope, templateName, modalTemplate) {
  return modalDialog.open({
    title: 'Space auto creation',
    template: modalTemplate(templateName.toLowerCase()),
    backgroundClose: false,
    persistOnNavigation: true,
    ignoreEsc: true,
    scope
  });
}
