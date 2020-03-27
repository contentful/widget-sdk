import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Heading, Paragraph, Button, Card, TextLink } from '@contentful/forma-36-react-components';

const styles = {
  flexContainer: css({
    display: 'flex',
    height: '100%',
    justifyContent: 'space-between',
  }),
  illustrationContainer: css({ alignSelf: 'flex-end' }),
  heading: css({ fontSize: tokens.fontSizeL, marginBottom: tokens.spacingS }),
  description: css({ fontSize: tokens.fontSizeM, marginBottom: tokens.spacingS }),
};

const CTACardComponent = ({
  heading,
  description,
  ctaLabel,
  onClick,
  illustration,
  href,
  isExternal,
}) => {
  return (
    <Card className={styles.flexContainer} padding="large">
      <div>
        <Heading className={styles.heading}>{heading}</Heading>
        <Paragraph className={styles.description}>{description}</Paragraph>
        {isExternal ? (
          <TextLink href={href} target="_blank">
            {ctaLabel}
          </TextLink>
        ) : (
          <Button onClick={onClick} href={href}>
            {ctaLabel}
          </Button>
        )}
      </div>
      <div className={styles.illustrationContainer}>{illustration}</div>
    </Card>
  );
};

CTACardComponent.propTypes = {
  heading: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  ctaLabel: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  illustration: PropTypes.node.isRequired,
  href: PropTypes.string,
  isExternal: PropTypes.bool,
};

export default CTACardComponent;
