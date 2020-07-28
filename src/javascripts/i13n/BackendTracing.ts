import * as locationUtils from 'utils/location';
import { getBrowserStorage } from 'core/services/BrowserStorage';

const tracingExpiryTimeout = 15 * 60 * 1000;
const storageKey = 'trace';

// init enables tracing if the tracing query parameter is present and automatically
// disables it after 15 mins
export function init(): void {
  const urlParams = locationUtils.getQueryString();
  const tracing = urlParams['trace'];

  if (!tracing) {
    return;
  }

  const sessionStorage = getBrowserStorage('session');
  sessionStorage.set(storageKey, tracing);

  setTimeout(() => {
    sessionStorage.remove(storageKey);
  }, tracingExpiryTimeout);
}

// tracingHeaders returns headers to enable tracing in the backend
export function tracingHeaders(): { [key: string]: string } {
  const sessionStorage = getBrowserStorage('session');
  const value = sessionStorage.get(storageKey);

  if (!value) {
    return {};
  }

  return {
    'cf-trace': value,
  };
}
