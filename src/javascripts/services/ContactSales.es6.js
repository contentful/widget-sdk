/**
 * @name services/contactSales
 * @description this service is used to generate a link to the sales form
 * it prefills all possible fields using currect user object from user$
 * and sends a given `inappsource` parameter in order to track users later
 */

import {getValue as getCurrentValue} from 'utils/kefir';
import {stringify} from 'libs/qs';
import {contactSalesUrl} from 'Config';
import {userDataBus$} from 'data/User/index';

function getUserData () {
  const [user, org] = getCurrentValue(userDataBus$);
  return {user, org};
}

/**
 * @description function to create a link to a pre-filled sales form
 * @param {String} source - where the user sees the link to the sales form
 * @return {String} - result URL to the marketing website with prefilled form
 */
export function createContactLink (source) {
  const {
    user: {firstName, lastName, email},
    org: {name: companyName} = {}
  } = getUserData();

  const props = {
    first_name: firstName,
    last_name: lastName,
    email: email,
    company: companyName,
    inappsource: source
  };

  return contactSalesUrl + '?' + stringify(props);
}
