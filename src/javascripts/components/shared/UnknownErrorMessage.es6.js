import React from 'react';
import UnknownErrorIllustration from 'svg/unknown-error-illustration.es6';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer.es6';
import { Heading, Button } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const svgStyles = css({ width: '400px', marginTop: tokens.spacingL });

const UnknownErrorMessage = props => (
  <EmptyStateContainer {...props}>
    <UnknownErrorIllustration className={svgStyles} />
    <Heading>Something went wrong</Heading>
    <Button
      buttonType="primary"
      onClick={() => {
        window.location.reload();
      }}>
      Reload the page
    </Button>
  </EmptyStateContainer>
);

export default UnknownErrorMessage;
