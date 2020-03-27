import React from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  Tag,
} from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import { sum } from 'lodash';
import { shorten } from 'utils/NumberUtils';
import { organizationResourceUsagePropType } from '../propTypes';
import calcRelativeSpaceUsage from '../utils/calcRelativeSpaceUsage';

const SpaceRow = ({ spaceName, spaceUsage, totalUsage, colour, isPoC }) => {
  return (
    <TableRow data-test-id="api-usage-table-row">
      <TableCell>
        <div>{spaceName || 'Deleted space'}</div>
        <div>
          {isPoC && (
            <Tooltip content="Proof of concept">
              <Tag tagType="muted">POC</Tag>
            </Tooltip>
          )}
        </div>
      </TableCell>
      {/* eslint-disable-next-line */}
      <TableCell style={{ verticalAlign: 'middle' }}>{shorten(sum(spaceUsage))}</TableCell>
      {/* eslint-disable-next-line */}
      <TableCell style={{ color: colour, verticalAlign: 'middle' }}>
        {calcRelativeSpaceUsage(spaceUsage, totalUsage)}%
      </TableCell>
    </TableRow>
  );
};

SpaceRow.propTypes = {
  spaceName: PropTypes.string,
  spaceUsage: PropTypes.arrayOf(PropTypes.number).isRequired,
  totalUsage: PropTypes.number.isRequired,
  colour: PropTypes.string.isRequired,
  isPoC: PropTypes.bool,
};

const SpacesTable = ({ spaceNames, data, totalUsage, colours, isPoC }) => {
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
        {data.map((item, index) => (
          <SpaceRow
            key={index}
            spaceName={spaceNames[item.sys.space.sys.id]}
            spaceUsage={item.usage}
            totalUsage={totalUsage}
            colour={colours[index]}
            index={index}
            isPoC={isPoC[item.sys.space.sys.id]}
          />
        ))}
      </TableBody>
    </Table>
  );
};

SpacesTable.propTypes = {
  spaceNames: PropTypes.objectOf(PropTypes.string).isRequired,
  totalUsage: PropTypes.number.isRequired,
  data: PropTypes.arrayOf(organizationResourceUsagePropType).isRequired,
  colours: PropTypes.arrayOf(PropTypes.string).isRequired,
  isPoC: PropTypes.objectOf(PropTypes.bool).isRequired,
};

export default SpacesTable;
