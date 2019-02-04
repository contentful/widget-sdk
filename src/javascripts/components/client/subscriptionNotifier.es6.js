import { registerFactory } from 'NgRegistry.es6';
import { get } from 'lodash';
import moment from 'moment';
import { isOwner } from 'services/OrganizationRoles.es6';

export default function register() {
  // TODO: it handles trials for v1 pricing. Should be removed sooner or later.
  registerFactory('subscriptionNotifier', [
    'paywallOpener',
    ({ openPaywall }) => ({
      notifyAbout: organization => {
        const isTrial = get(organization, ['subscription', 'status']) === 'trial';
        const trialEnd = moment(get(organization, ['trialPeriodEndsAt']));
        const now = moment();

        if (isTrial && !trialEnd.isAfter(now)) {
          const offerPlanUpgrade = isOwner(organization);
          openPaywall(organization, { offerPlanUpgrade });
        }
      }
    })
  ]);
}
