import React, { useState } from 'react';
import { css } from 'emotion';
import { TextLink, Paragraph } from '@contentful/forma-36-react-components';

const styles = {
  container: css({
    marginBottom: '30px',
  }),
  showMoreSection: css({
    marginTop: '20px',
  }),
};

const onLearnMore = () =>
  window.open(
    'https://www.contentful.com/pricing/?faq_category=payments&faq=what-is-a-proof-of-concept-poc-space#what-is-a-proof-of-concept-poc-space'
  );

export default function Info() {
  const [showMore, setShowMore] = useState(false);

  return (
    <section className={styles.container} data-test-id="enterprise-space-wizard.info">
      <Paragraph>
        Use a proof of concept space to experiment or start new projects. Talk to us when you decide
        to launch.
      </Paragraph>
      {showMore && (
        <div data-test-id="show-more-section" className={styles.showMoreSection}>
          <Paragraph>
            A proof of concept space is free of charge until you decide to use it for a live
            application. We can then help you to convert it to a regular production space.
          </Paragraph>
          <Paragraph>
            Proof of concept spaces share the same limits for API requests and asset bandwidth with
            the other spaces in your organization.{' '}
            <TextLink testId="learn-more-link" onClick={onLearnMore}>
              Learn more
            </TextLink>
          </Paragraph>
        </div>
      )}
      <TextLink testId="show-more-link" onClick={() => setShowMore(!showMore)}>
        {showMore ? 'Show less' : 'Show more'}
      </TextLink>
    </section>
  );
}
