import React from 'react';
import { getStore } from 'TheStore/index.es6';
import { omit } from 'lodash';
import { addNotification } from 'debug/DevNotifications.es6';
import { MOCK_APIS } from 'Config.es6';
import { getModule } from 'NgRegistry.es6';

const $window = getModule('$window');
const $location = getModule('$location');

const store = getStore().forKey('use_mock_api');

/**
 * Toggles between using actual API url, or Stoplight proxy, depending on
 * `use_mock_api` boolean query string parameter. Default is false.
 *
 * This is currently supported only on `preview` and `dev-on-preview` envs.
 */
export function init() {
  const urlParams = $location.search();
  const mockApiIdFromUrl = urlParams['use_mock_api'];
  const mockApiId = mockApiIdFromUrl || store.get();

  if (mockApiId) {
    const mockApiInfo = MOCK_APIS[mockApiId];

    $location.search(omit(urlParams, 'use_mock_api'));

    if (mockApiInfo && mockApiIdFromUrl) {
      store.set(mockApiId);
      // Ensure that there are absolutely no endpoints instantiated
      // that are still using the config's api url.
      setTimeout(() => $window.location.reload());
    } else if (mockApiInfo) {
      showNotification(mockApiInfo);
    } else {
      store.remove(); // No reason to keep an unknown ID around in our store.
    }
  }
}

function showNotification({ name, url }) {
  addNotification(
    <h5>
      {'Using'} <a href={url}>“{name}”</a> {'mock API '}
      <button className="btn-link" style={{ display: 'inline' }} onClick={disableMockApi}>
        clear
      </button>
    </h5>
  );
}

function disableMockApi() {
  store.remove();
  $window.location.reload();
}
