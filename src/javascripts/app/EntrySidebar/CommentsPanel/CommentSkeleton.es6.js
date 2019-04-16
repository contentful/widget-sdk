import React from 'react';
import {
  Card,
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonImage,
  SkeletonBodyText
} from '@contentful/forma-36-react-components';
import { range } from 'lodash';
import { styles } from './Comment.es6';

export default function CommentSkeleton() {
  return (
    <Card className={styles.comment}>
      <SkeletonContainer svgHeight={100}>
        <SkeletonImage width={36} height={36} radiusX={36} radiusY={36} />
        <SkeletonDisplayText offsetTop={8} offsetLeft={50} width={80} />
        <SkeletonBodyText offsetTop={50} lineHeight={12} numberOfLines={2} />
      </SkeletonContainer>
    </Card>
  );
}

export function CommentSkeletonGroup({ number = 5 }) {
  return range(number).map(n => <CommentSkeleton key={n} />);
}
