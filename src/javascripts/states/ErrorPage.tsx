import React from 'react';
import { css } from 'emotion';
import { Typography, Heading, Paragraph, Button } from '@contentful/forma-36-react-components';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import BrokenPencil from 'svg/broken-pencil.svg';
import ContactUsButton from 'ui/Components/ContactUsButton';
import { go } from 'states/Navigator';

const styles = {
  container: css({
    display: 'flex',
    justifyContent: 'center',

    // Navbar is 70px tall
    height: 'calc(100vh - 70px)',
  }),
};

function goHome() {
  go({
    path: ['home'],
  });
}

export default function ErrorPage() {
  return (
    <div className={styles.container}>
      <EmptyStateContainer data-test-id="cf-ui-error-state">
        <BrokenPencil className={defaultSVGStyle} />
        <Typography>
          <Heading>Oh snap! Something went wrong…</Heading>
          <Paragraph>
            Sorry, that was unexpected. Head back to your space or{' '}
            <ContactUsButton isLink noIcon>
              talk to support
            </ContactUsButton>{' '}
            if this keeps happening.
          </Paragraph>
          <Button testId="home-button" onClick={goHome}>
            Go to space home
          </Button>
        </Typography>
      </EmptyStateContainer>
    </div>
  );
}
