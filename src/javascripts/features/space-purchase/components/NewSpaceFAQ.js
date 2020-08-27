import React from 'react';

import { Accordion, AccordionItem } from '@contentful/forma-36-react-components/dist/alpha';
import { Typography, Heading, Paragraph } from '@contentful/forma-36-react-components';

import { websiteUrl } from 'Config';
import ExternalTextLink from 'app/common/ExternalTextLink';
import { SpaceLimitsTable } from './SpaceLimitsTable';
import { TierComparisonTable } from './TierComparisonTable';
import { css } from 'emotion';

const styles = {
  accordionItemTitles: css({
    button: {
      fontWeight: 600,
    },
  }),
};

export const NewSpaceFAQ = () => {
  return (
    <aside aria-labelledby="aside-label">
      <Typography>
        <Heading id="aside-label" element="h2">
          FAQs
        </Heading>
      </Typography>

      <Accordion className={styles.accordionItemTitles}>
        <AccordionItem title="What are the differences between the Community, Team and Enterprise tiers?">
          <Typography>
            <Paragraph>
              Every organization belongs to one of three tiers: Community, Team or Enterprise. The
              Community tier includes the free Community space, and applies to all users who only
              have this space in their organization. The Team tier includes Medium and Large spaces
              paid through a self-service plan; they require no contracts and can be cancelled at
              any time. Once you start paying for a space (by purchasing a space or upgrading the
              Community space) you are on the Team tier.
            </Paragraph>
            <Paragraph>
              The Enterprise tier has advanced features, including professional services and
              training. It features fewer limitations, and has custom pricing based on your needs.
            </Paragraph>
            <Paragraph>Each tier has different limits and support:</Paragraph>
          </Typography>

          <TierComparisonTable />
        </AccordionItem>
        <AccordionItem title="What are the types of spaces I can have?">
          <Typography>
            <Paragraph>Choose the right space depending on your needs:</Paragraph>
          </Typography>

          <SpaceLimitsTable />
        </AccordionItem>
        <AccordionItem title="How many users do I get?">
          <Paragraph>
            The Community tier offers 5 free users. Upon upgrading to a paid space, this is expanded
            to a total of 10 free users. Additional users can be added at a cost of $180 per user.
            On the Team tier, there is a maximum of 25 total users. Enterprise plans have no user
            limit.
          </Paragraph>
        </AccordionItem>
        <AccordionItem title="I noticed difference spaces, what’s changed?">
          <Paragraph>
            We listened to our core customers and restructured our offerings to deliver value at
            every stage of digital development. Our new Community space gives you more, for free.
            Customers no longer have to pay for access to GraphQL and can create content models with
            up to 48 content types on the Community space. Previously, we offered a free Micro space
            and paid Micro and Small spaces. These spaces weren’t the ideal tools to create the
            advanced digital experiences our customers are working on, so we’ve retired them in
            favor of spaces with larger limits and more features. This offers users a streamlined
            path from development to to production, both through our self-service Team tier and our
            Enterprise tier.
          </Paragraph>
        </AccordionItem>
        <AccordionItem title="What happens when I hit my space limit?">
          <Typography>
            <Paragraph>
              Once you hit the limit of environments, roles, locales, content types or records
              included in the space type, you will not be able to create another item. If you need
              to create more items, you can delete an existing item or upgrade to a space type with
              higher limits. Space admins can upgrade/downgrade a space to a different type directly
              in the web app.
            </Paragraph>
          </Typography>
          <Paragraph>
            Spaces also include{' '}
            <ExternalTextLink href={websiteUrl('pricing/')}>fair use limits</ExternalTextLink> for
            API calls and asset bandwidth. On the free Community tier, you will be rate limited once
            you reach 2,000,000 API calls. On the Team tier, you will be charged an overages fee for
            the excess amount. Extra API calls cost $5 per 1,000,000 calls, extra asset bandwidth
            $65 per 1 TB. Accounts without a valid credit card on record, will be frozen once they
            exceed the fair use limits. Enterprise tier customers are exempt from API overages.
          </Paragraph>
        </AccordionItem>
        <AccordionItem title="What payment methods do you accept?">
          <Paragraph>
            Customers on the Team tier can pay with a credit card (American Express, MasterCard or
            Visa). Enterprise customers have the choice of paying with a credit card or wire
            transfer.
          </Paragraph>
        </AccordionItem>
      </Accordion>
    </aside>
  );
};
