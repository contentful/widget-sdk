import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

import * as Intercom from 'intercom';
import {supportUrl} from 'Config';

import { TextLink } from '@contentful/ui-component-library';

const ContactUsButton = createReactClass({
  propTypes: {
    noIcon: PropTypes.bool
  },

  contactUs () {
    // Open intercom if it's possible, otherwise go to support page.
    if (Intercom.isEnabled()) {
      Intercom.open();
    } else {
      window.open(supportUrl);
    }
  },

  render () {
    const { noIcon, ...otherProps } = this.props;

    const props = {
      onClick: this.contactUs,
      ...otherProps
    };

    if (!noIcon) {
      props.icon = 'MdChatBubble';
    }

    return (
      <TextLink {...props}>Get in touch with us</TextLink>
    );
  }
});

export default ContactUsButton;
