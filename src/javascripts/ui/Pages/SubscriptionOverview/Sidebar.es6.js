import React from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { Heading, Paragraph, TextLink, Note } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import { href } from 'states/Navigator.es6';
import { billing, invoices } from './links.es6';

import Icon from 'ui/Components/Icon.es6';
import Price from 'ui/Components/Price.es6';
import ContactUsButton from 'ui/Components/ContactUsButton.es6';

import { isEnterprisePlan } from 'account/pricing/PricingDataProvider.es6';

const styles = {
  icon: css({
    fill: tokens.colorBlueDark,
    paddingRight: '6px',
    position: 'relative',
    bottom: '-0.125em'
  }),
  linkWithIcon: css({
    marginTop: tokens.spacingXs
  })
};

export function hasAnyInaccessibleSpaces(plans) {
  return plans.some(plan => {
    const space = plan.space;
    return space && !space.isAccessible;
  });
}

function PayingOnDemandOrgCopy({ grandTotal, isOrgOwner, organizationId }) {
  return (
    <>
      <Heading className="entity-sidebar__heading">Grand total</Heading>
      <Paragraph data-test-id="subscription-page.sidebar.grand-total">
        Your grand total is <Price value={grandTotal} style={{ fontWeight: 'bold' }} /> per month.
      </Paragraph>
      {isOrgOwner && (
        <Paragraph style={{ marginBottom: '28px' }}>
          <Icon name="invoice" className={styles.icon} />
          <TextLink
            href={href(invoices(organizationId))}
            className={styles.linkWithIcon}
            testId="subscription-page.sidebar.invoice-link">
            View invoices
          </TextLink>
        </Paragraph>
      )}
      <Note>
        <Paragraph>
          Note that the monthly invoice amount might deviate from the total shown above. This
          happens when you hit overages or make changes to your subscription during a billing cycle.
        </Paragraph>
        <Paragraph>
          <Icon name="invoice" className={styles.icon} />
          <TextLink
            href={href(invoices(organizationId))}
            className={styles.linkWithIcon}
            testId="subscription-page.sidebar.invoice-link">
            View invoices
          </TextLink>
        </Paragraph>
      </Note>
    </>
  );
}

function NonPayingOrgCopy({ organizationId }) {
  return (
    <>
      <Heading className="entity-sidebar__heading">Your payment details</Heading>
      <Paragraph>
        You need to provide us with your billing address and credit card details before creating
        paid spaces or adding users beyond the free limit.
      </Paragraph>
      <Icon name="invoice" className={styles.icon} />
      <TextLink
        href={href(billing(organizationId))}
        testId="subscription-page.sidebar.add-payment-link">
        Enter payment details
      </TextLink>
    </>
  );
}

function InaccessibleSpacesCopy({ isOrgOwner }) {
  return (
    <>
      <Heading className="entity-sidebar__heading">Spaces without permission</Heading>
      <Paragraph>
        Some of your spaces are not accessible, which means you cannot view the content or usage of
        those spaces.
      </Paragraph>
      <Paragraph>
        However, since you’re an organization {isOrgOwner ? 'owner' : 'admin'} you can grant
        yourself access by going to <i>users</i> and adding yourself to the space.
      </Paragraph>
    </>
  );
}

function NonEnterpriseCopy({ isOrgBillable }) {
  return (
    <>
      <Heading className="entity-sidebar__heading">Help</Heading>
      <Paragraph>
        {isOrgBillable && 'Do you need to upgrade or downgrade your spaces?'}
        {!isOrgBillable && 'Do you have any questions about our pricing?'}
        <> Don’t hesitate to talk to our customer success team.</>
      </Paragraph>
      <Paragraph>
        <ContactUsButton
          className={styles.linkWithIcon}
          testId="subscription-page.sidebar.contact-link"
        />
      </Paragraph>
    </>
  );
}

function EnterpriseCopy() {
  return (
    <>
      <Heading className="entity-sidebar__heading">Help</Heading>
      <Paragraph>
        Talk to us if you want to make changes to your spaces or launch a proof of concept space.
      </Paragraph>
      <Paragraph>
        <ContactUsButton
          className={styles.linkWithIcon}
          testId="subscription-page.sidebar.contact-link"
        />
      </Paragraph>
    </>
  );
}

function Sidebar(props) {
  const { basePlan, isOrgOwner, isOrgBillable, spacePlans } = props;

  const anyInaccessibleSpaces = hasAnyInaccessibleSpaces(spacePlans);

  return (
    <div className="entity-sidebar" data-test-id="subscription-page.sidebar">
      {isOrgBillable && !isEnterprisePlan(basePlan) && <PayingOnDemandOrgCopy {...props} />}
      {!isOrgBillable && isOrgOwner && <NonPayingOrgCopy {...props} />}
      {anyInaccessibleSpaces && <InaccessibleSpacesCopy {...props} />}
      {!isEnterprisePlan(basePlan) && <NonEnterpriseCopy {...props} />}
      {isEnterprisePlan(basePlan) && <EnterpriseCopy {...props} />}
    </div>
  );
}

PayingOnDemandOrgCopy.propTypes = NonPayingOrgCopy.propTypes = InaccessibleSpacesCopy.propTypes = NonEnterpriseCopy.propTypes = Sidebar.propTypes = {
  basePlan: PropTypes.object.isRequired,
  grandTotal: PropTypes.number.isRequired,
  organizationId: PropTypes.string.isRequired,
  isOrgOwner: PropTypes.bool.isRequired,
  isOrgBillable: PropTypes.bool.isRequired,
  spacePlans: PropTypes.array.isRequired
};

export default Sidebar;
