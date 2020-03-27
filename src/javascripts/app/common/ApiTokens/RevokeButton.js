import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import {
  Dropdown,
  DropdownList,
  Button,
  Paragraph,
  TextLink,
} from '@contentful/forma-36-react-components';

const styles = {
  revokeDropdown: css({
    padding: tokens.spacingXl,
    width: 350,
    textAlign: 'center',
  }),
  revokeButton: css({
    margin: tokens.spacingM,
    marginBottom: 0,
  }),
};

const RevokeButton = ({ revoke, token }) => {
  const [isOpen, setOpen] = useState(false);

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      position="bottom-right"
      toggleElement={
        <TextLink linkType="negative" onClick={() => setOpen(!isOpen)} testId="pat.revoke.request">
          Revoke
        </TextLink>
      }>
      <DropdownList className={styles.revokeDropdown}>
        <Paragraph>
          This token won’t be available anymore, any application using it might break. Do you
          confirm?
        </Paragraph>
        <Button
          testId="pat.revoke.confirm"
          onClick={() => {
            revoke(token);
            setOpen(false);
          }}
          className={styles.revokeButton}
          buttonType="negative">
          Revoke
        </Button>
        <Button
          className={styles.revokeButton}
          buttonType="muted"
          onClick={() => {
            setOpen(false);
          }}>
          Cancel
        </Button>
      </DropdownList>
    </Dropdown>
  );
};

RevokeButton.propTypes = {
  revoke: PropTypes.func.isRequired,
  token: PropTypes.object.isRequired,
};

export default RevokeButton;
