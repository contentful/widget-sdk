import React from 'react';
import * as Auth from 'Authentication';
import * as TokenResourceManager from './TokenResourceManager';
import { useTokensState } from './CMATokensViewReducer';

import CMATokensPATSection from './CMATokensPATSection';
import CMATokensOauthSection from './CMATokensOauthSection';

export function CMATokensView() {
  const tokenResourceManager = TokenResourceManager.create(Auth);
  const [state, actions] = useTokensState(tokenResourceManager);

  return (
    <React.Fragment>
      <CMATokensOauthSection />
      <CMATokensPATSection state={state} actions={actions} subheading />
    </React.Fragment>
  );
}
