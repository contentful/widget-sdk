import React from 'react';
import PropTypes from 'prop-types';

import * as Intercom from 'intercom';
import { supportUrl } from 'Config.es6';

import { TextLink } from '@contentful/ui-component-library';

class ContactUsButton extends React.Component {
  static propTypes = {
    noIcon: PropTypes.bool,
    children: PropTypes.node
  };

  contactUs = () => {
    // Open intercom if it's possible, otherwise go to support page.
    if (Intercom.isEnabled() && Intercom.isLoaded()) {
      Intercom.open();
    } else {
      window.open(supportUrl);
    }
  };

  render() {
    const { noIcon, children, ...otherProps } = this.props;

    const props = {
      onClick: this.contactUs,
      ...otherProps
    };

    if (!noIcon) {
      props.icon = 'ChatBubble';
    }

    return <TextLink {...props}>{children || `Get in touch with us`}</TextLink>;
  }
}

export default ContactUsButton;
