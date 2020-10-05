import React from 'react';
import {
  SkeletonBodyText,
  SkeletonContainer,
  TableCell,
  TableRow,
} from '@contentful/forma-36-react-components';

export const SkeletonRow = () => {
  return (
    <TableRow>
      <TableCell>
        <div>
          <SkeletonContainer svgWidth="420" svgHeight="40">
            <SkeletonBodyText />
          </SkeletonContainer>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <SkeletonContainer width="420" svgHeight="40">
            <SkeletonBodyText />
          </SkeletonContainer>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <SkeletonContainer svgHeight="40">
            <SkeletonBodyText numberOfLines={1} />
          </SkeletonContainer>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <SkeletonContainer svgWidth="50" svgHeight="40">
            <SkeletonBodyText numberOfLines={1} />
          </SkeletonContainer>
        </div>
      </TableCell>
    </TableRow>
  );
};
