import React from 'react';

import { Workbench } from '@contentful/forma-36-react-components';
import NavigationIcon from 'ui/Components/NavigationIcon';

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
        icon={<NavigationIcon icon="token" size="large" color="green" />}
        title={'Personal access tokens'}
      />
      <Workbench.Content type="default">
        <PersonalAccessTokenSection state={state} actions={actions} />
      </Workbench.Content>
    </Workbench>
  );
};
