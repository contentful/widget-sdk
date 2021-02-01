import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Button } from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink';
import * as accessChecker from 'access_control/AccessChecker';

const styles = {
  button: css({
    marginLeft: 'auto',
    flexShrink: '0',
  }),
};

export default function CreateContentTypeCta({ size = null, testId }) {
  const canCreateContentTypes = !accessChecker.shouldDisable(
    accessChecker.Action.CREATE,
    'contentType'
  );
  const allowedToCreateContentTypes = !accessChecker.shouldHide(
    accessChecker.Action.CREATE,
    'contentType'
  );

  if (!allowedToCreateContentTypes) {
    return null;
  }
  return (
    <StateLink path="^.new">
      {({ onClick }) => (
        <Button
          className={styles.button}
          size={size}
          testId={testId}
          disabled={!canCreateContentTypes}
          onClick={onClick}>
          Add content type
        </Button>
      )}
    </StateLink>
  );
}

CreateContentTypeCta.propTypes = {
  size: PropTypes.oneOf(['large', null]),
  testId: PropTypes.string,
};
