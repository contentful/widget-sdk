import * as React from 'react';

import { getModule } from 'core/NgRegistry';
import { CustomRouter, RouteErrorBoundary, Routes, Route } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';
import { ApiKeyListRoute, KeyEditorContainer, CMATokensRoute } from 'features/api-keys-management';
import { withRedirectReadOnlySpace } from 'states/utils';

const WithRedirectApiKeysList = withRedirectReadOnlySpace(ApiKeyListRoute);
const WithRedirectKeyEditor = withRedirectReadOnlySpace(KeyEditorContainer);
const WithRedirectCMATokens = withRedirectReadOnlySpace(CMATokensRoute);

function ApiKeysRouter() {
  const [basename] = window.location.pathname.split('api');
  const { spaceId } = getModule('$stateParams');

  return (
    <CustomRouter splitter="api">
      <RouteErrorBoundary>
        <Routes basename={basename + 'api'}>
          <Route
            name="spaces.detail.api.keys.list"
            path="/keys"
            element={<WithRedirectApiKeysList spaceId={spaceId} />}
          />
          <Route
            name="spaces.detail.api.keys.detail"
            path="/keys/:apiKeyId"
            element={<WithRedirectKeyEditor spaceId={spaceId} />}
          />
          <Route
            name="spaces.detail.api.cma_tokens"
            path="/cma_tokens"
            element={<WithRedirectCMATokens spaceId={spaceId} />}
          />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
}

export const apiKeysState = {
  name: 'api',
  url: '/api{pathname:any}',
  component: ApiKeysRouter,
};
