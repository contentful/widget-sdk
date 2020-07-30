import React, { useEffect, useState } from 'react';
import { css } from 'emotion';
import {
  Typography,
  Heading,
  Paragraph,
  Button,
  Modal,
} from '@contentful/forma-36-react-components';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import BrokenPencil from 'svg/broken-pencil.svg';
import ContactUsButton from 'ui/Components/ContactUsButton';
import { go } from 'states/Navigator';

import { getVariation, FLAGS } from 'LaunchDarkly';

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
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function main() {
      try {
        await getVariation(FLAGS.TEST_IF_LD_IS_WORKING);
      } catch {
        setShowModal(true);
      }
    }

    main();
  }, []);

  return (
    <>
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
      <Modal
        isShown={showModal}
        onClose={() => {
          setShowModal(false);
        }}
        title="You may be using an adblocker">
        <Typography>
          <Paragraph>
            Users with certain ad blocking extensions are currently experiencing issues with our
            application. If you’re using an ad blocker, please temporarily disable it or make an
            exception for <code>app.contentful.com</code>, and reload the app.
          </Paragraph>
          <Button onClick={() => setShowModal(false)}>OK</Button>
        </Typography>
      </Modal>
      ;
    </>
  );
}
