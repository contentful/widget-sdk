import CookieStore from 'utils/TheStore/CookieStore';
import {pickBy, merge} from 'lodash';

/**
 * @ngdoc service
 * @name analytics/userData
 * @description
 * A simple service preparing user data for
 * the analytical purposes.
 */

/**
 * @ngdoc method
 * @name analytics/userData#prepare
 * @param {object} userData
 * @returns {object}
 * @description
 * Sanitizes and extends user data with details
 * specific to the first visit.
 */
export function prepareUserData (userData) {
  if (userData.signInCount === 1) {
    // On first login, send referrer, campaign and A/B test data
    // if it has been set in marketing website cookie
    return merge(getFirstVisitData(), userData);
  } else {
    return userData;
  }
}

function getFirstVisitData () {
  return pickBy({
    firstReferrer: parseCookie('cf_first_visit', 'referer'),
    campaignName: parseCookie('cf_first_visit', 'campaign_name'),
    lastReferrer: parseCookie('cf_last_visit', 'referer'),
    experimentId: parseCookie('cf_experiment', 'experiment_id'),
    experimentVariationId: parseCookie('cf_experiment', 'variation_id')
  }, function (val) {
    return val !== null && val !== undefined;
  });
}

function parseCookie (cookieName, prop) {
  try {
    const cookie = CookieStore.get(cookieName);
    return JSON.parse(cookie)[prop];
  } catch (err) {
    return null;
  }
}
