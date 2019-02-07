import React from 'react';
import { getStore } from 'TheStore/index.es6';
import { omit } from 'lodash';
import { addNotification } from 'debug/DevNotifications.es6';
import { mockApiUrl } from 'Config.es6';
import { getModule } from 'NgRegistry.es6';

const $window = getModule('$window');
const location = getModule('$location');

const store = getStore().forKey('use_mock_api');

/**
 * Toggles between using actual API url, or Stoplight proxy, depending on
 * `use_mock_api` boolean query string parameter. Default is false.
 *
 * This is currently supported only on `preview` and `dev-on-preview` envs.
 */
export function init() {
  const urlParams = location.search();

  if (urlParams['use_mock_api']) {
    // Only set flag if current config has mock api url
    // (i.e. preview & dev-on-preview)
    if (mockApiUrl) {
      store.set(urlParams['use_mock_api'] === 'true');
    }
    // Update url without reloading
    location.search(omit(urlParams, 'use_mock_api'));
  }

  if (store.get()) {
    addNotification(
      <h5>
        {'Using mock API '}
        <button className="btn-link" style={{ display: 'inline' }} onClick={disableMockApi}>
          clear
        </button>
      </h5>,
      <a href={mockApiUrl}>{mockApiUrl}</a>
    );
  }
}

function disableMockApi() {
  store.remove();
  $window.location.reload();
}
