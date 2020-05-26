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
  Typography,
  SkeletonContainer,
  SkeletonBodyText,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import { billing } from './links';

import Icon from 'ui/Components/Icon';
import { Price } from 'core/components/formatting';
import ContactUsButton from 'ui/Components/ContactUsButton';

const styles = {
  icon: css({
    fill: tokens.colorBlueDark,
    paddingRight: '6px',
    position: 'relative',
    bottom: '-0.125em',
  }),
  linkWithIcon: css({
    marginTop: tokens.spacingXs,
  }),
  grandTotal: css({
    marginBottom: tokens.spacingM,
  }),
};

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

PayingOnDemandOrgCopy.propTypes = {
  grandTotal: PropTypes.number.isRequired,
};

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

NonPayingOrgCopy.propTypes = {
  organizationId: PropTypes.string.isRequired,
};

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

InaccessibleSpacesCopy.propTypes = {
  organizationId: PropTypes.string.isRequired,
  isOrgOwner: PropTypes.bool,
};

InaccessibleSpacesCopy.defaultProps = {
  isOrgOwner: false,
};

function HelpCopy({ initialLoad, enterprisePlan }) {
  return (
    <>
      <Heading className="entity-sidebar__heading">Help</Heading>
      {initialLoad && (
        <SkeletonContainer svgHeight={56}>
          <SkeletonBodyText numberOfLines={2} />
        </SkeletonContainer>
      )}
      {enterprisePlan && (
        <Paragraph>
          Talk to us if you want to make changes to your spaces or launch a proof of concept space.
        </Paragraph>
      )}
      <Paragraph>
        <ContactUsButton
          isLink
          className={styles.linkWithIcon}
          testId="subscription-page.sidebar.contact-link"
        />
      </Paragraph>
    </>
  );
}

HelpCopy.propTypes = {
  initialLoad: PropTypes.bool,
  enterprisePlan: PropTypes.bool,
};

HelpCopy.defaultProps = {
  initialLoad: true,
  enterprisePlan: false,
};

function Sidebar(props) {
  const {
    initialLoad,
    enterprisePlan,
    isOrgOwner,
    isOrgBillable,
    hasAnyInaccessibleSpaces,
    grandTotal,
    organizationId,
  } = props;

  return (
    <div className="entity-sidebar" data-test-id="subscription-page.sidebar">
      {initialLoad ? (
        <>
          <SkeletonContainer svgHeight={100}>
            <SkeletonBodyText numberOfLines={4} />
          </SkeletonContainer>
          <br />
          <SkeletonContainer svgHeight={100}>
            <SkeletonBodyText numberOfLines={4} />
          </SkeletonContainer>
        </>
      ) : (
        <>
          {isOrgBillable && !enterprisePlan && <PayingOnDemandOrgCopy grandTotal={grandTotal} />}
          {!isOrgBillable && isOrgOwner && <NonPayingOrgCopy organizationId={organizationId} />}
          {hasAnyInaccessibleSpaces && (
            <InaccessibleSpacesCopy organizationId={organizationId} isOrgOwner={isOrgOwner} />
          )}
        </>
      )}
      <HelpCopy initialLoad={initialLoad} enterprisePlan={enterprisePlan} />
    </div>
  );
}

Sidebar.propTypes = {
  initialLoad: PropTypes.bool.isRequired,
  grandTotal: PropTypes.number,
  organizationId: PropTypes.string.isRequired,
  hasAnyInaccessibleSpaces: PropTypes.bool,
  enterprisePlan: PropTypes.bool,
  isOrgOwner: PropTypes.bool,
  isOrgBillable: PropTypes.bool,
};

Sidebar.defaultProps = {
  grandTotal: 0,
  hasAnyInaccessibleSpaces: false,
  enterprisePlan: false,
  isOrgOwner: false,
  isOrgBillable: false,
};

export default Sidebar;
