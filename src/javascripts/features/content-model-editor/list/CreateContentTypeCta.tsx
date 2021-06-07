import React from 'react';
import { css } from 'emotion';
import { Button, ButtonProps } from '@contentful/forma-36-react-components';
import * as accessChecker from 'access_control/AccessChecker';
import { RouteLink } from 'core/react-routing';

const styles = {
  button: css({
    marginLeft: 'auto',
    flexShrink: 0,
  }),
};

export function CreateContentTypeCta({
  size,
  testId,
}: {
  size?: ButtonProps['size'];
  testId: string;
}) {
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
    <RouteLink route={{ path: 'content_types.new' }}>
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
    </RouteLink>
  );
}
