import React from 'react';

import { Workbench } from '@contentful/forma-36-react-components';
import { NavigationIcon } from '@contentful/forma-36-react-components/dist/alpha';

import * as Auth from 'Authentication';
import * as TokenResourceManager from '../cma-tokens/TokenResourceManager';
import { useTokensState } from '../cma-tokens/CMATokensViewReducer';
import { PersonalAccessTokenSection } from '../api-tokens/PersonalAccessTokenSection';

export const UserCMATokensRoute = () => {
  const tokenResourceManager = TokenResourceManager.createToken(Auth);
  const [state, actions] = useTokensState(tokenResourceManager);

  return (
    <Workbench>
      <Workbench.Header
        icon={<NavigationIcon icon="Token" size="large" />}
        title={'Personal access tokens'}
      />
      <Workbench.Content type="default">
        <PersonalAccessTokenSection state={state} actions={actions} />
      </Workbench.Content>
    </Workbench>
  );
};
