import React from 'react';
import { TextLink, TextLinkProps } from '@contentful/forma-36-react-components';
import cn from 'classnames';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  secretiveLink: css({
    display: 'inline-flex',
    width: '100%',
    color: tokens.colorTextMid,
    fontWeight: tokens.fontWeightNormal,
    textDecoration: 'none',
    '& > span': {
      width: 'inherit',
    },
    '&:link': {
      textDecoration: 'none',
      fontWeight: tokens.fontWeightNormal,
      display: 'inline-flex',
      '&:link:hover': {
        textDecoration: 'none',
      },
    },
    '&:focus': {
      outline: 'none',
      boxShadow: 'unset',
      textDecoration: 'none',
    },
  }),
};
/**
 * Provides right click => open in a new tab flow
 */
const SecretiveLink = ({
  href,
  className,
  children,
  ...rest
}: TextLinkProps & { href: string }) => {
  return (
    <TextLink
      // @ts-expect-error tabIndex is not listed in props
      tabIndex="-1"
      className={cn(styles.secretiveLink, className)}
      href={href}
      rel="noopener noreferrer"
      linkType="secondary"
      target="_blank"
      onClick={(e) => e.preventDefault()}
      {...rest}>
      {children}
    </TextLink>
  );
};

export default SecretiveLink;
