import React from 'react';
import PropTypes from 'prop-types';
import { TextLink, Button } from '@contentful/forma-36-react-components';

import { supportUrl } from 'Config';
import * as Intercom from 'services/intercom';

class ContactUsButton extends React.Component {
  static propTypes = {
    noIcon: PropTypes.bool,
    buttonType: PropTypes.oneOf(['link', 'button']),
    children: PropTypes.node,
  };

  onClick = () => {
    // Open intercom if it's possible, otherwise go to support page.
    if (Intercom.isEnabled()) {
      Intercom.open();
    } else {
      window.open(supportUrl);
    }
  };

  render() {
    const { noIcon, buttonType, children, ...otherProps } = this.props;

    const isLink = !buttonType || buttonType === 'link';
    const ButtonComponent = isLink ? TextLink : Button;

    const props = {
      onClick: this.onClick,
      ...otherProps,
    };

    if (!noIcon) {
      props.icon = 'ChatBubble';
    }

    return <ButtonComponent {...props}>{children || `Get in touch with us`}</ButtonComponent>;
  }
}

export default ContactUsButton;
