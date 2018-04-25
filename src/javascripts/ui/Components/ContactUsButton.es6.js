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
      <p>
        <TextLink
          label="Get in touch with us"
          onClick={this.contactUs}
          data-test-id='subscription-page.sidebar.contact-link'
          icon="MdChatBubble"
        />
      </p>
    );
  }
});

export default ContactUsButton;
