import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import { Workbench } from '@contentful/forma-36-react-components';
import NavigationIcon from 'ui/Components/NavigationIcon';

import * as Auth from 'Authentication';
import * as TokenResourceManager from '../settings/api/cma-tokens/TokenResourceManager';
import { useTokensState } from '../settings/api/cma-tokens/CMATokensViewReducer';

import PersonalAccessTokenSection from 'app/common/ApiTokens/PersonalAccessTokenSection';

const UserCMATokens = ({ onReady }) => {
  const tokenResourceManager = TokenResourceManager.create(Auth);
  const [state, actions] = useTokensState(tokenResourceManager);

  useEffect(onReady, [onReady]);

  return (
    <Workbench>
      <Workbench.Header
        icon={<NavigationIcon name="token" size="large" color="green" />}
        title={'Personal access tokens'}
      />
      <Workbench.Content type="default">
        <PersonalAccessTokenSection state={state} actions={actions} />
      </Workbench.Content>
    </Workbench>
  );
};

UserCMATokens.propTypes = {
  onReady: PropTypes.func.isRequired
};

export default UserCMATokens;
