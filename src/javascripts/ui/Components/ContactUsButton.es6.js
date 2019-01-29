import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { TextLink, Button } from '@contentful/forma-36-react-components';

class ContactUsButton extends React.Component {
  static propTypes = {
    noIcon: PropTypes.bool,
    buttonType: PropTypes.oneOf(['link', 'button']),
    children: PropTypes.node,

    contactUs: PropTypes.func.isRequired
  };

  render() {
    const { noIcon, buttonType, children, contactUs, ...otherProps } = this.props;

    const isLink = !buttonType || buttonType === 'link';
    const ButtonComponent = isLink ? TextLink : Button;

    const props = {
      onClick: contactUs,
      ...otherProps
    };

    if (!noIcon) {
      props.icon = 'ChatBubble';
    }

    return <ButtonComponent {...props}>{children || `Get in touch with us`}</ButtonComponent>;
  }
}

export default connect(
  null,
  dispatch => ({
    contactUs: () => dispatch({ type: 'CONTACT_US' })
  })
)(ContactUsButton);
