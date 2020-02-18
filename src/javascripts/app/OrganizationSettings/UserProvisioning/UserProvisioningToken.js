import React from 'react';
import PropTypes from 'prop-types';
import { TextInput, Note } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  note: css({
    marginTop: tokens.spacingXs,
    marginBottom: tokens.spacingL
  })
};

export default function UserProvisioningToken({ personalAccessToken }) {
  return (
    <>
      <Note
        noteType="positive"
        title={`"${personalAccessToken.name}" is ready!`}
        className={styles.note}>
        Make sure to immediately copy your new Personal Access Token. You won’t be able to see it
        again.
      </Note>
      <TextInput
        name="scim-token"
        testId="scim-token"
        disabled
        withCopyButton
        value={`Bearer ${personalAccessToken.token}`}
      />
    </>
  );
}

UserProvisioningToken.propTypes = {
  personalAccessToken: PropTypes.any.isRequired
};
