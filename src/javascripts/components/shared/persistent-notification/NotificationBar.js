import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Button, TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  notification: css({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: `${tokens.spacingXs} ${tokens.spacingM}`,
    color: tokens.colorWhite,
    backgroundColor: tokens.colorBlueBase,
  }),
  message: css({
    margin: `0 ${tokens.spacingXs}`,
    color: tokens.colorWhite,
  }),
  link: css({
    color: tokens.colorWhite,
    margin: `0 ${tokens.spacingXs}`,
    textDecoration: 'underline',
    '&:link': {
      color: tokens.colorWhite,
    },
    '&:hover, &:focus, &:link:hover, &:link:focus': {
      color: tokens.colorWhite,
      textDecoration: 'none',
    },
  }),
  button: css({
    margin: `0 ${tokens.spacingXs}`,
  }),
};

export function NotificationBar(props) {
  if (!props.contents) {
    return null;
  }

  const { contents, linkUrl, linkText, actionMessage, onClickAction } = props;
  const shouldShowLink = linkText && linkUrl;
  const shouldShowActionButton = actionMessage && onClickAction;

  return (
    <div className={styles.notification} data-test-id="persistent-notification">
      <div
        className={styles.message}
        data-test-id="persistent-notification-message"
        dangerouslySetInnerHTML={{ __html: contents }}
      />
      {shouldShowLink && (
        <TextLink
          href={linkUrl}
          className={styles.link}
          data-test-id="persistent-notification-link">
          {linkText}
        </TextLink>
      )}
      {shouldShowActionButton && (
        <Button
          className={styles.button}
          buttonType="primary"
          onClick={onClickAction}
          data-test-id="persistent-notification-action-button">
          {actionMessage}
        </Button>
      )}
    </div>
  );
}

NotificationBar.propTypes = {
  contents: PropTypes.oneOfType([PropTypes.string, PropTypes.node, PropTypes.element]),
  linkText: PropTypes.string,
  linkUrl: PropTypes.string,
  actionMessage: PropTypes.string,
  onClickAction: PropTypes.func,
};
