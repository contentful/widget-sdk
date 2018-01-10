import {createElement as h} from 'libs/react';
import location from '$location';
import TheStore from 'TheStore';
import {omit} from 'lodash';
import {addNotification} from 'debug/DevNotifications';
import {settings} from 'environment';

const store = TheStore.forKey('use_mock_api');

/**
* Toggles between using actual API url, or Stoplight proxy, depending on
* `use_mock_api` boolean query string parameter. Default is false.
*
* This is currently supported only on `preview` and `dev-on-preview` envs.
*/
export function init () {
  const urlParams = location.search();

  if (urlParams['use_mock_api']) {
    // Only set flag if current config has mock api url
    // (i.e. preview & dev-on-preview)
    if (settings.mockApiUrl) {
      store.set(urlParams['use_mock_api'] === 'true');
    }
    // Update url without reloading
    location.search(omit(urlParams, 'use_mock_api'));
  }

  if (store.get()) {
    addNotification(
      'Using mock API',
      h('a', {href: settings.mockApiUrl}, settings.mockApiUrl)
    );
  }
}
