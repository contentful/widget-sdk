import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Accordion, AccordionItem } from '@contentful/forma-36-react-components/dist/alpha';
import {
  Typography,
  Heading,
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonBodyText,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { EVENTS } from '../utils/analyticsTracking';

import { ContentfulRichText } from 'core/services/ContentfulCDA';

const styles = {
  accordionItemTitles: css({
    button: {
      fontWeight: tokens.fontWeightMedium,
    },
  }),
};

export const NewSpaceFAQ = ({ faqEntries, trackWithSession }) => {
  if (!faqEntries) {
    return <FAQLoadingState />;
  }

  return (
    <aside aria-labelledby="aside-label">
      <Typography>
        <Heading id="aside-label" element="h2">
          FAQs
        </Heading>
      </Typography>
      <Accordion className={styles.accordionItemTitles}>
        {/** FAQ using Contentful */}
        {faqEntries.map((entry, idx) => {
          const trackFAQClick = () => {
            trackWithSession(EVENTS.FAQ_SECTION_OPEN, {
              question: entry.fields.question,
            });
          };

          return (
            <AccordionItem key={idx} title={entry.fields.question} onExpand={trackFAQClick}>
              <Typography>
                <ContentfulRichText document={entry.fields.answer} />
              </Typography>
            </AccordionItem>
          );
        })}
      </Accordion>
    </aside>
  );
};
NewSpaceFAQ.propTypes = {
  trackWithSession: PropTypes.func.isRequired,
  faqEntries: PropTypes.arrayOf(
    PropTypes.shape({
      question: PropTypes.string,
      answer: PropTypes.object,
    })
  ),
};

function FAQLoadingState() {
  return (
    <SkeletonContainer svgHeight={117} testId="faq-loading">
      <SkeletonDisplayText />
      <SkeletonBodyText numberOfLines={4} offsetTop={29} />
    </SkeletonContainer>
  );
}
