import React from 'react';
import {
  SkeletonBodyText,
  SkeletonContainer,
  TableCell,
  TableRow
} from '@contentful/forma-36-react-components';
import { range } from 'lodash';

export default () => (
  <TableRow testId="loading-placeholder">
    <TableCell colSpan="4">
      <SkeletonContainer
        data-test-id="content-loader"
        ariaLabel="Loading Space teams list"
        svgWidth="100%">
        {range(2).map((_, index) => (
          <SkeletonBodyText key={index} numberOfLines={2} offsetTop={index * 75} />
        ))}
      </SkeletonContainer>
    </TableCell>
  </TableRow>
);
