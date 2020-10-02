import React from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tag,
  SkeletonRow,
} from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import { sum } from 'lodash';
import { shorten } from 'utils/NumberUtils';
import { calcRelativeSpaceUsage } from '../utils/calcRelativeSpaceUsage';
import { useUsageState, colours } from '../hooks/usageContext';
import { TRIAL_SPACE_FREE_SPACE_PLAN_NAME } from 'account/pricing/PricingDataProvider';

const SpaceRow = ({ spaceId, spaceUsage, color }) => {
  const { spaceNames, totalUsage, spaceTypeLookup } = useUsageState();

  const spaceName = spaceNames[spaceId];
  const spaceType = spaceTypeLookup[spaceId];

  return (
    <TableRow data-test-id="api-usage-table-row">
      <TableCell>
        <div>{spaceName || 'Deleted space'}</div>
        <div>
          {spaceType === TRIAL_SPACE_FREE_SPACE_PLAN_NAME && <Tag tagType="muted">{spaceType}</Tag>}
        </div>
      </TableCell>
      {/* eslint-disable-next-line */}
      <TableCell style={{ verticalAlign: 'middle' }}>{shorten(sum(spaceUsage))}</TableCell>
      {/* eslint-disable-next-line */}
      <TableCell style={{ color: color, verticalAlign: 'middle' }}>
        {calcRelativeSpaceUsage(spaceUsage, totalUsage)}%
      </TableCell>
    </TableRow>
  );
};

SpaceRow.propTypes = {
  spaceId: PropTypes.string,
  spaceUsage: PropTypes.arrayOf(PropTypes.number),
  color: PropTypes.string,
};

export const SpacesTable = () => {
  const { periodicUsage, selectedSpacesTab, isLoading } = useUsageState();

  const data = isLoading ? [] : periodicUsage.apis[selectedSpacesTab].items;

  return (
    <Table data-test-id="api-usage-table">
      <TableHead>
        <TableRow>
          <TableCell>Space</TableCell>
          <TableCell>Current usage period</TableCell>
          <TableCell>Total API requests (%)</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {isLoading && <SkeletonRow rowCount={5} columnCount={3} />}
        {data.map((item, index) => (
          <SpaceRow
            key={index}
            spaceId={item.sys.space.sys.id}
            spaceUsage={item.usage}
            color={colours[index]}
          />
        ))}
      </TableBody>
    </Table>
  );
};
