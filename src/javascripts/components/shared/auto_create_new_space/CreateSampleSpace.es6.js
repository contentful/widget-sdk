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

export default function (user, spacesByOrg, templateName = 'product catalogue') {
  let dialog;
  const scope = $rootScope.$new();

  scope.isCreatingSpace = true;
  return getTemplatesList()
    .then(chooseTemplate(templateName.toLowerCase()))
    .then(template => openDialog(template, dialog, scope))
    .then(({ template }) => createEmptySpace(template, user, spacesByOrg))
    .then(gotoNewSpace)
    .then(preTemplateLoadSetup)
    // TODO: handle v.retried
    .then(loadTemplateIntoSpace)
    .catch(_ => handleSpaceAutoCreateError(dialog))
    .finally(_ => {
      scope.isCreatingSpace = false;
    });
}

export function getOwnedOrgs (orgMemberships) {
  // filter out orgs user owns
  return orgMemberships.filter(org => org.role === 'owner');
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

function createEmptySpace (template, user, spacesByOrg) {
  const org = getFirstOwnedOrgWithoutSpaces(user, spacesByOrg);
  const data = {
    name: 'Sample project',
    defaultLocale: 'en-US'
  };

  if (!org) {
    return $q.reject(new Error('No owned org found'));
  }

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

function handleSpaceAutoCreateError (dialog) {
  dialog.cancel();
}

function getFirstOwnedOrgWithoutSpaces (user, spacesByOrg) {
  const ownedOrgs = getOwnedOrgs(user.organizationMemberships);

  // return the first org that has no spaces
  const orgMembership = find(ownedOrgs, ownedOrg => {
    const spacesForOrg = spacesByOrg[ownedOrg.sys.id];

    return !spacesForOrg || spacesForOrg.length === 0;
  });

  return orgMembership && orgMembership.organization;
}
