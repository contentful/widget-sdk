import { supportUrl } from 'Config.es6';
import * as Intercom from 'services/intercom.es6';

export default () => next => action => {
  if (action.type === 'CONTACT_US') {
    // Open intercom if it's possible, otherwise go to support page.
    if (Intercom.isEnabled()) {
      Intercom.open();
    } else {
      window.open(supportUrl);
    }
  }
  return next(action);
};
