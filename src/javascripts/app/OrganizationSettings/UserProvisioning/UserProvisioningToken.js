import React from 'react';
import PropTypes from 'prop-types';
import { TextInput, Note } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { ReactRouterLink } from 'core/react-routing';

const styles = {
  note: css({
    marginBottom: tokens.spacingL,
  }),
};

export default function UserProvisioningToken({ personalAccessToken }) {
  return (
    <>
      <Note
        noteType="positive"
        title={`"${personalAccessToken.name}" is ready!`}
        className={styles.note}>
        Make sure to immediately copy your new personal access token. You won’t be able to see it
        again.
        <br />
        <ReactRouterLink
          route={{ path: 'account.cma_tokens' }}
          data-test-id="tokens-url"
          target="_blank"
          rel="noopener noreferrer">
          Manage your tokens.
        </ReactRouterLink>
      </Note>
      <TextInput
        name="scim-token"
        testId="scim-token"
        disabled
        withCopyButton
        value={personalAccessToken.token}
      />
    </>
  );
}

UserProvisioningToken.propTypes = {
  personalAccessToken: PropTypes.any.isRequired,
};
