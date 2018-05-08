import React from 'react';
import createReactClass from 'create-react-class';

import * as Intercom from 'intercom';
import {supportUrl} from 'Config';

import { TextLink } from '@contentful/ui-component-library';

const ContactUsButton = createReactClass({
  contactUs () {
    // Open intercom if it's possible, otherwise go to support page.
    if (Intercom.isEnabled()) {
      Intercom.open();
    } else {
      window.open(supportUrl);
    }
  },

  render () {
    return (
      <TextLink
        onClick={this.contactUs}
        icon="MdChatBubble"
        {...this.props}
      >Get in touch with us</TextLink>
    );
  }
});

export default ContactUsButton;
