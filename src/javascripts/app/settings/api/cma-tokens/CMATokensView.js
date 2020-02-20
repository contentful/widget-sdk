import React from 'react';
import * as Auth from 'Authentication';
import * as TokenResourceManager from './TokenResourceManager';
import { useTokensState } from './CMATokensViewReducer';
import { Typography, Subheading } from '@contentful/forma-36-react-components';

import CMATokensOauthSection from './CMATokensOauthSection';
import PersonalAccessTokenSection from 'app/common/ApiTokens/PersonalAccessTokenSection';

export function CMATokensView() {
  const tokenResourceManager = TokenResourceManager.create(Auth);
  const [state, actions] = useTokensState(tokenResourceManager);

  return (
    <React.Fragment>
      <CMATokensOauthSection />
      <Typography>
        <Subheading element="h2">Personal access tokens</Subheading>
      </Typography>
      <PersonalAccessTokenSection state={state} actions={actions} />
    </React.Fragment>
  );
}
