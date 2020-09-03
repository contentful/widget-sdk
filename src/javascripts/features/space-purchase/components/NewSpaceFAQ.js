import React, { useCallback } from 'react';
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

import { useAsync } from 'core/hooks/useAsync';
import { ContentfulRichText } from 'core/services/ContentfulCDA';
import { fetchFaqEntries } from '../services/fetchFaqEntries';

const styles = {
  accordionItemTitles: css({
    button: {
      fontWeight: tokens.fontWeightMedium,
    },
  }),
};

export const NewSpaceFAQ = () => {
  const { isLoading, data } = useAsync(useCallback(fetchFaqEntries, []));

  if (isLoading) {
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
        {data.map((entry, idx) => {
          return (
            <AccordionItem key={idx} title={entry.fields.question}>
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

function FAQLoadingState() {
  return (
    <SkeletonContainer svgHeight={117}>
      <SkeletonDisplayText />
      <SkeletonBodyText numberOfLines={4} offsetTop={29} />
    </SkeletonContainer>
  );
}
