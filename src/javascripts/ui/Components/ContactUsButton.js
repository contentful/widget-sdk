import React from 'react';
import PropTypes from 'prop-types';
import { TextLink, Button } from '@contentful/forma-36-react-components';

import { supportUrl } from 'Config';
import * as Intercom from 'services/intercom';

const openSupport = () => {
  // Open intercom if it's possible, otherwise go to support page.
  if (Intercom.isEnabled()) {
    Intercom.open();
  } else {
    window.open(supportUrl);
  }
};

export default function ContactUsButton(props) {
  const { noIcon, isLink, children, ...otherProps } = props;

  const ButtonComponent = isLink ? TextLink : Button;

  const buttonComponentProps = {
    onClick: openSupport,
    ...otherProps,
  };

  if (!noIcon) {
    props.icon = 'ChatBubble';
  }

  return (
    <ButtonComponent {...buttonComponentProps}>
      {children || `Get in touch with us`}
    </ButtonComponent>
  );
}

ContactUsButton.propTypes = {
  noIcon: PropTypes.bool,
  isLink: PropTypes.bool,
};

ContactUsButton.defaultProps = {
  noIcon: false,
  isLink: false,
};
