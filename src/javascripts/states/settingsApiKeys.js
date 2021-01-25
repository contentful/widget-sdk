import React from 'react';
import PropTypes from 'prop-types';
import * as TokenStore from 'services/TokenStore';
import { ApiKeyListRoute, CMATokensRoute, KeyEditorContainer } from 'features/api-keys-management';
import { go } from 'states/Navigator';

/**
 * This module export the API section state.
 *
 * It consists of
 * - /api/keys            The CDA key list
 * - /api/keys/:apiKeyId  The CDA key editor for a key
 * - /api/cma_keys        The CMA key section
 * - /api/content_model   Redirection for the legacy content model explorer
 */

function withRedirectReadOnlySpace(Component) {
  function WithRedirectReadOnlySpace(props) {
    const [space, setSpace] = React.useState(null);

    React.useEffect(() => {
      async function loadSpace() {
        const space = await TokenStore.getSpace(props.spaceId);
        setSpace(space);
      }

      loadSpace();
    }, [props.spaceId]);

    React.useEffect(() => {
      if (space?.readOnlyAt) {
        go({
          path: ['spaces', 'detail', 'home'],
          params: { spaceId: space.sys.id },
        });
      }
    }, [space]);

    return <Component {...props} />;
  }

  WithRedirectReadOnlySpace.propTypes = {
    spaceId: PropTypes.string.isRequired,
  };

  return WithRedirectReadOnlySpace;
}

export const apiKeysState = {
  name: 'api',
  url: '/api',
  abstract: true,
  children: [
    {
      name: 'keys',
      abstract: true,
      url: '/keys',
      children: [
        {
          name: 'list',
          url: '',
          component: withRedirectReadOnlySpace(ApiKeyListRoute),
        },
        {
          name: 'detail',
          url: '/:apiKeyId',
          component: withRedirectReadOnlySpace(KeyEditorContainer),
        },
      ],
    },
    {
      name: 'cma_tokens',
      url: '/cma_tokens',
      component: withRedirectReadOnlySpace(CMATokensRoute),
    },
    {
      // Legacy path
      name: 'cma_keys',
      url: '/cma_keys',
      redirectTo: 'spaces.detail.api.cma_tokens',
    },
    {
      // Legacy path
      name: 'content_model',
      url: '/content_model',
      redirectTo: 'spaces.detail.content_types.list',
    },
  ],
};
