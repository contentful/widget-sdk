import client from 'client';
import $rootScope from '$rootScope';
import spaceContext from 'spaceContext';
import modalDialog from 'modalDialog';
import { runTask } from 'utils/Concurrent';

import {getCreator} from 'spaceTemplateCreator';
import {track} from 'analytics/Analytics';
import {go as gotoState} from 'states/Navigator';
import {entityActionSuccess} from 'analytics/events/SpaceCreation';
import {find, noop} from 'lodash';
import {getTemplate, getTemplatesList} from 'spaceTemplateLoader';

import autoCreateSpaceTemplate from './Template';
import * as TokenStore from 'services/TokenStore';

/**
 * @description
 * Creates a sample space using the given template in the
 * given org.
 *
 * @param {object} org
 * @param {string} templateName
 *
 * @returns Promise<undefined>
 */
export default function (org, templateName) {
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

  const scope = $rootScope.$new();

  return runTask(function* () {
    scope.isCreatingSpace = true;
    const template = yield* loadTemplate(templateName);
    const dialog = openDialog(scope, templateName);

    try {
      yield* createSpace(org, template.name);
      yield* applyTemplate(spaceContext, template);
      yield spaceContext.publishedCTs.refresh();
      $rootScope.$broadcast('spaceTemplateCreated');

      scope.isCreatingSpace = false;
    } catch (e) {
      scope.isCreatingSpace = false;
      if (dialog) {
        dialog.cancel();
      }
      throw e;
    }
  });
}


/**
 * Create a new space in the given org, reload the token and go to the
 * space home.
 */
function* createSpace (org, templateName) {
  const newSpace = yield client.createSpace({
    name: 'Sample project',
    defaultLocale: 'en-US'
  }, org.sys.id);
  track('space:create', { templateName: templateName });
  yield TokenStore.refresh();
  yield gotoState({
    path: ['spaces', 'detail'],
    params: {
      spaceId: newSpace.getId()
    }
  });
}


/**
 * Load the space contents for the template info and add it to the
 * current space.
 */
function* applyTemplate (spaceContext, templateInfo) {
  const templateCreator = getCreator(
    spaceContext,
    {
      onItemSuccess: entityActionSuccess,
      onItemError: noop
    },
    templateInfo.name
  );

  const loadedTemplate = yield getTemplate(templateInfo);

  yield templateCreator.create(loadedTemplate);
}


/**
 * Try to load a template with the given name.
 *
 * Throws an error if no template with this name is found.
 */
function* loadTemplate (name) {
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


function openDialog (scope, templateName) {
  return modalDialog.open({
    title: 'Space auto creation',
    template: autoCreateSpaceTemplate(templateName.toLowerCase()),
    backgroundClose: false,
    persistOnNavigation: true,
    scope
  });
}
