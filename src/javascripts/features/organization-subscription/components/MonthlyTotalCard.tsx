import React from 'react';
import { css, cx } from 'emotion';
import {
  Icon,
  List,
  Heading,
  Tooltip,
  Card,
  Paragraph,
  Typography,
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonBodyText,
  ListItem,
} from '@contentful/forma-36-react-components';

import { Price } from 'core/components/formatting';
import { useCalculateSubscriptionCosts } from '../hooks/useCalculateSubscriptionCosts';
import tokens from '@contentful/forma-36-tokens';

const borderStyle = `1px solid ${tokens.colorElementMid}`;

const styles = {
  fullRow: css({
    gridColumnStart: 1,
    gridColumnEnd: 3,
  }),
  icon: css({
    marginLeft: tokens.spacing2Xs,
  }),
  removeFlexMargin: css({
    marginBottom: 0,
  }),
  lineItem: css({
    p: {
      marginBottom: tokens.spacingXs,
    },
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 'spacingXs',
  }),
  monthlyTotal: css({
    p: {
      fontWeight: tokens.fontWeightDemiBold,
    },
    paddingTop: tokens.spacingXs,
    borderTop: borderStyle,
    borderBottom: borderStyle,
  }),
};

export function MonthlyTotalCard() {
  const subscriptionCosts = useCalculateSubscriptionCosts();

  return (
    <Card testId="monthly-total-card" padding="large">
      {!subscriptionCosts && <LoadingState />}

      {subscriptionCosts && (
        <Typography>
          <Heading>
            Monthly total{' '}
            <Tooltip
              place="bottom"
              content="The amount on your invoice might differ from the amount shown above because of usage
            overages or changes you make to the subscription during a billing cycle.">
              <Icon className={styles.icon} icon="InfoCircleTrimmed" color="muted" />
            </Tooltip>
          </Heading>
          <List>
            {subscriptionCosts.lineItems.map((item, index) => {
              return <LineItem key={index} name={item.name} price={item.price} />;
            })}
            <LineItem name="Monthly total" price={subscriptionCosts.total} isTotal />
          </List>
        </Typography>
      )}
    </Card>
  );
}

interface LineItemProps {
  name: string;
  price: number;
  isTotal?: boolean;
}

function LineItem({ name, price, isTotal = false }: LineItemProps) {
  return (
    <ListItem
      testId="subscription-page.monthly-total.list-item"
      className={cx(styles.lineItem, { [styles.monthlyTotal]: isTotal })}>
      <Paragraph>{name}</Paragraph>
      <Paragraph>
        <Price value={price} />
      </Paragraph>
    </ListItem>
  );
}

function LoadingState() {
  return (
    <SkeletonContainer svgHeight={190}>
      <SkeletonDisplayText />
      <SkeletonBodyText numberOfLines={3} offsetTop={48} />
    </SkeletonContainer>
  );
}
