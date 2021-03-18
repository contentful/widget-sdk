import React from 'react';
import {
  Card,
  SkeletonBodyText,
  SkeletonContainer,
  SkeletonDisplayText,
  Typography,
} from '@contentful/forma-36-react-components';

import { styles } from '../EmbargoedAssets.styles';

export function LoadingFeature() {
  return (
    <Card testId="loading-section-card" className={styles.sectionWide}>
      <Typography className={styles.centered}>
        <SkeletonContainer>
          <SkeletonDisplayText numberOfLines={1} width={200} />
          <SkeletonBodyText numberOfLines={5} offsetTop={35} />
        </SkeletonContainer>
      </Typography>
    </Card>
  );
}
