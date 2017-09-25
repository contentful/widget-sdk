import {find} from 'lodash';

import $q from '$q';
import client from 'client';
import $rootScope from '$rootScope';
import spaceContext from 'spaceContext';
import modalDialog from 'modalDialog';

import {getCreator} from 'spaceTemplateCreator';
import {go as gotoState} from 'states/Navigator';
import {entityActionSuccess} from 'analytics/events/SpaceCreation';
import {getTemplate, getTemplatesList} from 'spaceTemplateLoader';
import {track} from 'analytics/Analytics';

import autoCreateSpaceTemplate from './Template';
import * as tokenStore from 'services/TokenStore';

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
export default function (org = required('org'), templateName) {
  let dialog;
  const scope = $rootScope.$new();

  // not using default fn param as '' should use a default as well
  templateName = templateName || 'product catalogue';

  scope.isCreatingSpace = true;
  return getTemplatesList()
    .then(chooseTemplate(templateName.toLowerCase()))
    .then(template => openDialog(template, dialog, scope))
    .then(({ template }) => createEmptySpace(org, template))
    .then(gotoNewSpace)
    .then(preTemplateLoadSetup)
    // TODO: handle v.retried
    .then(loadTemplateIntoSpace)
    .catch(e => {
      if (dialog) {
        dialog.cancel();
      }
      return $q.reject(e);
    })
    .finally(_ => {
      scope.isCreatingSpace = false;
    });
}

/*
 * throws an error synchronously to differentiate it from
 * a rejected promise as a rejected promise stands for
 * something going wrong during space creation
 * while this stands for a programmer error
 */
function required (param) {
  throw new Error(`Required param ${param} not provided`);
}

function chooseTemplate (templateName) {
  return templates => {
    const template = find(templates, t => t.fields.name.toLowerCase() === templateName);

    if (!template) {
      return $q.reject(new Error(`Template named ${templateName} not found`));
    } else {
      track('space:template_selected', {
        templateName: template.name
      });

      return template.fields;
    }
  };
}

function openDialog (template, dialog, scope) {
  dialog = modalDialog.open({
    title: 'Space auto creation',
    template: autoCreateSpaceTemplate(),
    backgroundClose: false,
    persistOnNavigation: true,
    scope
  });
  return { template, dialog };
}

function createEmptySpace (org, template) {
  const data = {
    name: 'Sample project',
    defaultLocale: 'en-US'
  };

  return client
    .createSpace(data, org.sys.id)
    .then(
      newSpace => tokenStore
        .refresh()
        .then(_ => {
          track('space:create', {
            templateName: template.name
          });
          return { newSpace, template };
        })
    );
}

function gotoNewSpace ({ newSpace, template }) {
  return gotoState({
    path: ['spaces', 'detail'],
    params: {
      spaceId: newSpace.getId()
    }
  }).then(_ => template);
}

function preTemplateLoadSetup (selectedTemplate) {
  const itemHandlers = {
    // no need to show status of individual items
    onItemSuccess: entityActionSuccess,
    onItemError: _.noop
  };
  const templateLoader = getCreator(
    spaceContext,
    itemHandlers,
    selectedTemplate.name
  );

  return getTemplate(selectedTemplate)
    .then((template, retried) => ({ template, retried, templateLoader }));
}

function loadTemplateIntoSpace ({ template, templateLoader }) {
  return templateLoader
    .create(template)
    .then(spaceContext.publishedCTs.refresh)
    .then(_ => $rootScope.$broadcast('spaceTemplateCreated'));
}
