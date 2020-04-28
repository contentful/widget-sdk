import React from 'react';
import PropTypes from 'prop-types';
import { Button, Paragraph, Typography } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { TokenList } from './TokenList';

const styles = {
  pageSection: css({
    marginBottom: tokens.spacing2Xl,
  }),
};

export const PersonalAccessTokenSection = ({ state, actions }) => {
  const { loadingTokens, loadingTokensError, tokens, currentPage, totalPages } = state;
  const { Revoke, SelectPage } = actions;

  return (
    <div className={styles.pageSection}>
      <Typography>
        <Paragraph>
          As an alternative to OAuth applications, you can also leverage Personal Access Tokens to
          use the Content Management API. These tokens are always bound to your individual account,
          with the same permissions you have on all of your spaces and organizations.
        </Paragraph>
      </Typography>
      <div>
        <Button testId="pat.create.open" onClick={() => actions.OpenCreateDialog()}>
          Generate personal token
        </Button>
      </div>
      <TokenList
        loadingTokens={loadingTokens}
        loadingTokensError={loadingTokensError}
        tokens={tokens}
        currentPage={currentPage}
        totalPages={totalPages}
        revoke={Revoke}
        selectPage={SelectPage}
      />
    </div>
  );
};

PersonalAccessTokenSection.propTypes = {
  state: PropTypes.object,
  actions: PropTypes.object,
};
