import React from 'react';
import { css } from 'emotion';
import { SkeletonContainer, SkeletonBodyText } from '@contentful/forma-36-react-components';

const styles = {
  billingDetailsLoadingState: css({
    width: '200px',
  }),
};

export function CreditCardDetailsLoading() {
  return (
    <div data-test-id="credit-card-details-loading" className={styles.billingDetailsLoadingState}>
      <SkeletonContainer svgHeight={40} ariaLabel="Loading credit card details...">
        <SkeletonBodyText numberOfLines={2} />
      </SkeletonContainer>
    </div>
  );
}
