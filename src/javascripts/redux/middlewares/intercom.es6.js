import { supportUrl } from 'Config.es6';
import { getModule } from 'NgRegistry.es6';

const Intercom = getModule('intercom');

export default () => next => action => {
  if (action.type === 'CONTACT_US') {
    // Open intercom if it's possible, otherwise go to support page.
    if (Intercom.isEnabled() && Intercom.isLoaded()) {
      Intercom.open();
    } else {
      window.open(supportUrl);
    }
  }
  return next(action);
};
