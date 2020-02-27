import React from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import { sum } from 'lodash';
import { shorten } from 'utils/NumberUtils';
import { organizationResourceUsagePropType } from '../propTypes';
import { css } from 'emotion';

const apiColumnStyle = colour =>
  css({
    color: colour
  });

const calcRelativeSpaceUsage = (spaceUsage, totalUsage) => {
  const spaceUsageSum = sum(spaceUsage);
  return spaceUsageSum === 0 ? 0 : Math.round((spaceUsageSum / totalUsage) * 100);
};

const renderTableRow = (spaceName, spaceUsage, totalUsage, colour) => {
  return (
    <TableRow key={spaceName}>
      <TableCell>{spaceName ? spaceName : 'Deleted space'}</TableCell>
      <TableCell>{shorten(sum(spaceUsage))}</TableCell>
      <TableCell className={apiColumnStyle(colour)}>
        {`${calcRelativeSpaceUsage(spaceUsage, totalUsage)}%`}
      </TableCell>
    </TableRow>
  );
};

const SpacesTable = ({ spaceNames, apiName, data, totalUsage, colours }) => {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Space</TableCell>
          <TableCell>{apiName}</TableCell>
          <TableCell>API %</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((item, index) =>
          renderTableRow(spaceNames[item.sys.space.sys.id], item.usage, totalUsage, colours[index])
        )}
      </TableBody>
    </Table>
  );
};

SpacesTable.propTypes = {
  apiName: PropTypes.string.isRequired,
  spaceNames: PropTypes.objectOf(PropTypes.string).isRequired,
  totalUsage: PropTypes.number.isRequired,
  data: PropTypes.arrayOf(organizationResourceUsagePropType).isRequired,
  colours: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default SpacesTable;
