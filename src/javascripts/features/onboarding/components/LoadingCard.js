import React from 'react';
import {
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonBodyText,
  SkeletonText,
  Card,
  SkeletonImage,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';

const styles = {
  loadingContainer: css({
    maxWidth: '1280px',
    margin: '0 auto',
  }),
};

export function LoadingCard() {
  return (
    <div className={styles.loadingContainer}>
      <SkeletonContainer svgHeight={100}>
        <SkeletonDisplayText offsetTop={10} width={500} offsetBottom={10} />
        <SkeletonText lineHeight={20} width={400} offsetTop={50} />
      </SkeletonContainer>
      <SkeletonContainer svgHeight={40}>
        <SkeletonText width={150} offsetTop={5} offsetBottom={5} />
      </SkeletonContainer>
      <Card>
        <SkeletonContainer svgHeight={100}>
          <SkeletonImage
            width={16}
            height={16}
            radiusX={16}
            radiusY={16}
            offsetLeft={12}
            offsetTop={24}
          />
          <SkeletonDisplayText offsetTop={24} offsetLeft={40} width={80} />
          <SkeletonBodyText offsetTop={70} offsetLeft={40} lineHeight={12} numberOfLines={1} />
        </SkeletonContainer>
      </Card>
    </div>
  );
}