import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink.es6';
import * as accessChecker from 'access_control/AccessChecker/index.es6';

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
    <StateLink to="^.new">
      {({ onClick }) => (
        <Button
          icon="PlusCircle"
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
  testId: PropTypes.string
};
