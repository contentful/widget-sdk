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

let dialog;
let spaceCreationPromise;
let scope = $rootScope.$new();

export default function (user, spacesByOrg) {
  if (!scope.isCreatingSpace) {
    scope.isCreatingSpace = true;
    spaceCreationPromise = getTemplatesList()
      // choose template
      .then(chooseTemplate)
      // bring up dialog
      .then(openDialog)
      // create space
      .then(t => createEmptySpace(t, user, spacesByOrg))
      // go to new space
      .then(gotoNewSpace)
      // setup before loading template
      .then(preTemplateLoadSetup)
      // load template into space
      // handle v.retried
      .then(loadTemplateIntoSpace)
      // handle error
      .catch(handleSpaceAutoCreateError)
      .finally(_ => {
        scope.isCreatingSpace = false;
      });
  }
  return spaceCreationPromise;
}

export function getOwnedOrgs (orgMemberships) {
  // filter out orgs user owns
  return orgMemberships.filter(org => org.role === 'owner');
}

function chooseTemplate (templates) {
  const template = find(templates, t => t.fields.name.toLowerCase() === 'product catalogue').fields;

  track('space:template_selected', {
    templateName: template.name
  });

  return template;
}

function openDialog (template) {
  dialog = modalDialog.open({
    title: 'Space auto creation',
    template: autoCreateSpaceTemplate(),
    backgroundClose: false,
    persistOnNavigation: true,
    scope
  });

  return template;
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
    .then((template, retried) => {
      return { template, retried, templateLoader };
    });
}

function loadTemplateIntoSpace ({ template, templateLoader }) {
  return templateLoader
    .create(template)
    .then(_ => spaceContext.publishedCTs.refresh())
    .then(_ => $rootScope.$broadcast('spaceTemplateCreated'));
}

function handleSpaceAutoCreateError () {
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
