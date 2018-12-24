'use strict';

// TODO: it handles trials for v1 pricing. Should be removed sooner or later.
angular.module('contentful').factory('subscriptionNotifier', [
  'require',
  require => {
    const moment = require('moment');
    const { get } = require('lodash');
    const OrganizationRoles = require('services/OrganizationRoles.es6');
    const { openPaywall } = require('paywallOpener');

    return {
      notifyAbout: organization => {
        const isTrial = get(organization, ['subscription', 'status']) === 'trial';
        const trialEnd = moment(get(organization, ['trialPeriodEndsAt']));
        const now = moment();

        if (isTrial && !trialEnd.isAfter(now)) {
          const offerPlanUpgrade = OrganizationRoles.isOwner(organization);
          openPaywall(organization, { offerPlanUpgrade });
        }
      }
    };
  }
]);
