import React from 'react';
import {
  Card,
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonImage,
  SkeletonText,
} from '@contentful/forma-36-react-components';
import { styles } from './styles';

const ItemSkeleton = (props: { baseTop: number }) => (
  <React.Fragment>
    <SkeletonImage offsetTop={props.baseTop} width={36} height={36} radiusX={36} radiusY={36} />
    <SkeletonText offsetTop={props.baseTop + 15} offsetLeft={50} lineHeight={8} width={240} />
    <SkeletonText offsetTop={props.baseTop + 15} offsetLeft={510} lineHeight={8} width={90} />
  </React.Fragment>
);

export const MarketplacePageLoading = () => {
  return (
    <>
      <SkeletonContainer svgWidth={600} svgHeight={40} ariaLabel="Loading apps list...">
        <SkeletonDisplayText />
      </SkeletonContainer>
      <Card padding="large" className={styles.appListCard}>
        <SkeletonContainer svgWidth={600} svgHeight={150} ariaLabel="Loading apps list...">
          <ItemSkeleton baseTop={0} />
          <ItemSkeleton baseTop={55} />
          <ItemSkeleton baseTop={110} />
        </SkeletonContainer>
      </Card>
    </>
  );
};
