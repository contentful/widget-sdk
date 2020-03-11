import React from 'react';
import PropTypes from 'prop-types';
import UnknownErrorIllustration from 'svg/illustrations/unknown-error-illustration.svg';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import { Paragraph, Heading, Button } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const svgStyles = css({ width: '400px', marginTop: tokens.spacingL });

const UnknownErrorMessage = ({
  buttonText,
  description,
  heading,
  onButtonClick,
  ...otherProps
}) => (
  <EmptyStateContainer {...otherProps}>
    <UnknownErrorIllustration className={svgStyles} />
    <Heading>{heading}</Heading>
    {description && <Paragraph>{description}</Paragraph>}
    <Button buttonType="primary" onClick={onButtonClick}>
      {buttonText}
    </Button>
  </EmptyStateContainer>
);

UnknownErrorMessage.propTypes = {
  buttonText: PropTypes.string,
  description: PropTypes.string,
  heading: PropTypes.string,
  onButtonClick: PropTypes.func
};

UnknownErrorMessage.defaultProps = {
  buttonText: 'Reload the page',
  description: '',
  heading: 'Something went wrong',
  onButtonClick: window.location.reload
};

export default UnknownErrorMessage;
