import { getCreator } from 'services/SpaceTemplateCreator';
import { track } from 'analytics/Analytics';
import { go as gotoState } from 'states/Navigator';
import { find, noop } from 'lodash';
import { getTemplate, getTemplatesList } from 'services/SpaceTemplateLoader';
import autoCreateSpaceTemplate from './Template';
import * as TokenStore from 'services/TokenStore';
import { getModule } from 'core/NgRegistry';
import client from 'services/client';
import * as logger from 'services/logger';

const DEFAULT_LOCALE = 'en-US';

/**
 * @description
 * Creates a sample space using the given template in the
 * given org.
 *
 * @param {object} org
 * @param {Function} modalTemplate - template used by the modal dialog service
 *
 * @returns Promise<undefined>
 */
export default function (org) {
  const $rootScope = getModule('$rootScope');
  const spaceContext = getModule('spaceContext');

  const TEMPLATE = 'the example app';

  /*
   * throws an error synchronously to differentiate it from
   * a rejected promise as a rejected promise stands for
   * something going wrong during space creation
   * while this stands for a programmer error
   */
  if (!org) {
    throw new Error('Required param org not provided');
  }

  // to measure how long it took to fail
  const startingMoment = Date.now();

  const scope = $rootScope.$new();

  const create = async function () {
    scope.isCreatingSpace = true;

    openDialog(scope);

    const template = await loadTemplate(TEMPLATE);
    let newSpace;

    try {
      newSpace = await createSpace(org, template.name);
      await applyTemplate(spaceContext, template);
      await spaceContext.publishedCTs.refresh();
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
          template: TEMPLATE,
          // how long did it take to end up here
          runningTime: Date.now() - startingMoment,
        },
        groupingHash: 'Failed sample space creation',
      });

      throw e;
    } finally {
      scope.isCreatingSpace = false;
    }

    return newSpace;
  };

  return create();
}

/**
 * Create a new space in the given org, reload the token and go to the
 * space home.
 */
async function createSpace(org, templateName) {
  const newSpace = await client.createSpace(
    {
      name: 'The example project',
      defaultLocale: DEFAULT_LOCALE,
    },
    org.sys.id
  );

  await TokenStore.refresh();
  await gotoState({
    path: ['spaces', 'detail'],
    params: {
      spaceId: newSpace.sys.id,
    },
  });
  track('space:create', {
    templateName,
    // mark space as an auto created space
    entityAutomationScope: { scope: 'auto_create' },
  });
  return newSpace;
}

/**
 * Load the space contents for the template info and add it to the
 * current space.
 */
async function applyTemplate(spaceContext, templateInfo) {
  const templateCreator = getCreator(
    spaceContext,
    {
      onItemSuccess: noop,
      onItemError: noop,
    },
    templateInfo,
    DEFAULT_LOCALE
  );

  const loadedTemplate = await getTemplate(templateInfo);

  const { contentCreated, spaceSetup } = templateCreator.create(loadedTemplate);

  // supress all errors, since dialog will
  // be closed anyway via `contentCreated` promise
  // We need to catch all errors, because http requests
  // are backed by $q, and we have global handlers on
  // $q errors
  spaceSetup.catch(() => {});

  await contentCreated;
}

/**
 * Try to load a template with the given name.
 *
 * Throws an error if no template with this name is found.
 */
async function loadTemplate(name) {
  const templates = await getTemplatesList();
  const template = find(templates, (t) => t.fields.name.toLowerCase() === name.toLowerCase());

  if (!template) {
    throw new Error(`Template named ${name} not found`);
  } else {
    track('space:template_selected', {
      templateName: template.name,
    });

    return template.fields;
  }
}

function openDialog(scope) {
  const modalDialog = getModule('modalDialog');

  return modalDialog.open({
    title: 'Space auto creation',
    template: autoCreateSpaceTemplate(),
    backgroundClose: false,
    persistOnNavigation: true,
    ignoreEsc: true,
    scope,
  });
}
