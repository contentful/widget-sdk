import React from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import StateLink from 'app/common/StateLink';
import {
  DisplayText,
  Heading,
  Paragraph,
  TextLink,
  Note,
  Typography
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import { billing } from './links';

import Icon from 'ui/Components/Icon';
import Price from 'ui/Components/Price';
import ContactUsButton from 'ui/Components/ContactUsButton';

import { isEnterprisePlan } from 'account/pricing/PricingDataProvider';

const styles = {
  icon: css({
    fill: tokens.colorBlueDark,
    paddingRight: '6px',
    position: 'relative',
    bottom: '-0.125em'
  }),
  linkWithIcon: css({
    marginTop: tokens.spacingXs
  }),
  grandTotal: css({
    marginBottom: tokens.spacingM
  })
};

export function hasAnyInaccessibleSpaces(plans) {
  return plans.some(plan => {
    const space = plan.space;
    return space && !space.isAccessible;
  });
}

function PayingOnDemandOrgCopy({ grandTotal }) {
  return (
    <>
      <Heading className="entity-sidebar__heading">Monthly total</Heading>
      <DisplayText
        element="h2"
        data-test-id="subscription-page.sidebar.grand-total"
        className={styles.grandTotal}>
        <Price value={grandTotal} />
      </DisplayText>
      <Note>
        <Paragraph>
          The amount on your invoice might differ from the amount shown above because of usage
          overages or changes you make to the subscription during a billing cycle.
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
      <StateLink
        component={TextLink}
        testId="subscription-page.sidebar.add-payment-link"
        {...billing(organizationId)}>
        Enter payment details
      </StateLink>
    </>
  );
}

function InaccessibleSpacesCopy({ isOrgOwner, organizationId: orgId }) {
  return (
    <>
      <Heading className="entity-sidebar__heading">Spaces without permission</Heading>
      <Typography>
        <Paragraph>
          You can’t see usage or content for some of your spaces because you’re not a member of
          those spaces.
        </Paragraph>
        <Paragraph>
          However, since you’re an organization {isOrgOwner ? 'owner' : 'admin'} you can grant
          yourself access by going to{' '}
          <StateLink path="account.organizations.users.list" params={{ orgId }}>
            Users
          </StateLink>{' '}
          and adding yourself to the space.
        </Paragraph>
      </Typography>
    </>
  );
}

function NonEnterpriseCopy() {
  return (
    <>
      <Heading className="entity-sidebar__heading">Help</Heading>
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
