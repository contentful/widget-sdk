import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import {
  Paragraph,
  Heading,
  TextLink,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  SkeletonRow,
  Card,
} from '@contentful/forma-36-react-components';

import ExternalTextLink from 'app/common/ExternalTextLink';
import { websiteUrl } from 'Config';
import tokens from '@contentful/forma-36-tokens';

import { calculatePlansCost } from 'utils/SubscriptionUtils';
import { Pluralized, Price } from 'core/components/formatting';

import SpacePlanRow from './SpacePlanRow';

const styles = {
  total: css({
    marginBottom: '1.5em',
  }),
  nameCol: css({
    width: '30%',
  }),
  typeCol: css({
    width: '30%',
  }),
  createdByCol: css({
    width: '20%',
  }),
  actionsCol: css({
    width: '60px',
  }),
  planChangingCard: css({
    padding: '20px',
    marginBottom: '30px',
  }),
  cardTitle: css({
    marginBottom: '8px',
    fontWeight: 'bold',
    color: tokens.colorTextMid,
  }),
};

function SpacePlans({
  initialLoad,
  spacePlans,
  upgradedSpaceId,
  onCreateSpace,
  onChangeSpace,
  onDeleteSpace,
  enterprisePlan,
  organizationId,
  showMicroSmallSupportCard,
}) {
  const numSpaces = spacePlans.length;
  const totalCost = calculatePlansCost({ plans: spacePlans });

  const linkToSupportPage = websiteUrl(
    `support/?utm_source=webapp&utm_medium=account-menu&utm_campaign=in-app-help&purchase-micro-or-small-space=${organizationId}`
  );

  return (
    <>
      <Heading className="section-title">Spaces</Heading>

      {showMicroSmallSupportCard && (
        <Card className={styles.planChangingCard} testId="subscription-page.support-request-card">
          <Paragraph className={styles.cardTitle}>We&apos;re changing our plans</Paragraph>
          <Paragraph className={styles.total}>
            We recently updated the spaces available on our plans. For the remainder of 2020, you
            can continue to purchase new small and micro spaces by submitting a support request. To
            learn about the changes{' '}
            <ExternalTextLink
              testId="subscription-page.pricing-information-link"
              href={websiteUrl('pricing/')}>
              visit our website
            </ExternalTextLink>
            {'.'}
          </Paragraph>
          <ExternalTextLink
            testId="subscription-page.support-request-link"
            href={linkToSupportPage}>
            Submit a support request
          </ExternalTextLink>{' '}
        </Card>
      )}

      <Paragraph className={styles.total} testId="subscription-page.organization-information">
        {numSpaces > 0 ? (
          <>
            Your organization has{' '}
            <b>
              <Pluralized text="space" count={numSpaces} />
            </b>
            {'. '}
          </>
        ) : (
          "Your organization doesn't have any spaces. "
        )}
        {!enterprisePlan && totalCost > 0 && (
          <span data-test-id="subscription-page.non-enterprise-price-information">
            The total for your spaces is{' '}
            <b>
              <Price value={totalCost} />
            </b>{' '}
            per month.{' '}
          </span>
        )}
        <TextLink testId="subscription-page.create-space" onClick={onCreateSpace}>
          Create Space
        </TextLink>
      </Paragraph>

      {(initialLoad || numSpaces > 0) && (
        <Table testId="subscription-page.table">
          <colgroup>
            <col className={styles.nameCol} />
            <col className={styles.typeCol} />
            <col className={styles.createdByCol} />
            <col className={styles.createdOnCol} />
            <col className={styles.actionsCol} />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Space type</TableCell>
              <TableCell>Created by</TableCell>
              <TableCell>Created on</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {initialLoad ? (
              <SkeletonRow columnCount={5} rowCount={10} />
            ) : (
              spacePlans.map((plan) => {
                const isUpgraded = Boolean(plan.space && plan.space.sys.id === upgradedSpaceId);
                return (
                  <SpacePlanRow
                    key={plan.sys.id || (plan.space && plan.space.sys.id)}
                    plan={plan}
                    onChangeSpace={onChangeSpace}
                    onDeleteSpace={onDeleteSpace}
                    hasUpgraded={isUpgraded}
                    enterprisePlan={enterprisePlan}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      )}
    </>
  );
}

SpacePlans.propTypes = {
  initialLoad: PropTypes.bool,
  showMicroSmallSupportCard: PropTypes.bool,
  organizationId: PropTypes.string,
  spacePlans: PropTypes.array.isRequired,
  onCreateSpace: PropTypes.func.isRequired,
  onChangeSpace: PropTypes.func.isRequired,
  onDeleteSpace: PropTypes.func.isRequired,
  enterprisePlan: PropTypes.bool,
  upgradedSpaceId: PropTypes.string,
};

SpacePlans.defaultProps = {
  initialLoad: true,
  enterprisePlan: false,
  upgradedSpaceId: '',
};

export default SpacePlans;
