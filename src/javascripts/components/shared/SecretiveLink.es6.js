import React from 'react';
import PropTypes from 'prop-types';
import { TextLink } from '@contentful/forma-36-react-components';
import cn from 'classnames';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  secretiveLink: css({
    display: 'inline-flex',
    width: '100%',
    color: tokens.colorTextMid,
    textDecoration: 'none',
    '& > span': {
      width: 'inherit'
    },
    '&:link': {
      textDecoration: 'none',
      display: 'inline-flex'
    },
    '&:focus': {
      outline: 'none',
      boxShadow: 'unset',
      textDecoration: 'none'
    }
  })
};
/**
 * Provides right click => open in a new tab flow
 */
const SecretiveLink = ({ href, className, children, ...rest }) => {
  return (
    <TextLink
      className={cn(styles.secretiveLink, className)}
      tabIndex="-1"
      href={href}
      rel="noopener noreferrer"
      linkType="secondary"
      target="_blank"
      onClick={e => e.preventDefault()}
      {...rest}>
      {children}
    </TextLink>
  );
};

SecretiveLink.propTypes = {
  href: PropTypes.string.isRequired,
  className: PropTypes.string
};

export default SecretiveLink;
