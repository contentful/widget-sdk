import React from 'react';
import { css } from 'emotion';
import { SkeletonContainer, SkeletonBodyText } from '@contentful/forma-36-react-components';

const styles = {
  billingDetailsLoadingState: css({
    width: '200px',
  }),
};

export function BillingDetailsLoading() {
  return (
    <div data-test-id="billing-details-loading" className={styles.billingDetailsLoadingState}>
      <SkeletonContainer svgHeight={120} ariaLabel="Loading billing address...">
        <SkeletonBodyText numberOfLines={5} />
      </SkeletonContainer>
    </div>
  );
}
