import React from 'react';

import { Workbench } from '@contentful/forma-36-react-components';
import NavigationIcon from 'ui/Components/NavigationIcon';

import * as Auth from 'Authentication';
import * as TokenResourceManager from '../settings/api/cma-tokens/TokenResourceManager';
import { useTokensState } from '../settings/api/cma-tokens/CMATokensViewReducer';

import PersonalAccessTokenSection from 'app/common/ApiTokens/PersonalAccessTokenSection';

const UserCMATokens = () => {
  const tokenResourceManager = TokenResourceManager.create(Auth);
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

export default UserCMATokens;
