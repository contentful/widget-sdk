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
  return !totalUsage ? 0 : Math.round((sum(spaceUsage) / totalUsage) * 100);
};

const SpaceRow = ({ spaceName, spaceUsage, totalUsage, colour }) => {
  return (
    <TableRow data-test-id="api-usage-table-row">
      <TableCell>{spaceName || 'Deleted space'}</TableCell>
      <TableCell>{shorten(sum(spaceUsage))}</TableCell>
      <TableCell className={apiColumnStyle(colour)}>
        {calcRelativeSpaceUsage(spaceUsage, totalUsage)}%
      </TableCell>
    </TableRow>
  );
};

SpaceRow.propTypes = {
  spaceName: PropTypes.string,
  spaceUsage: PropTypes.arrayOf(PropTypes.number).isRequired,
  totalUsage: PropTypes.number.isRequired,
  colour: PropTypes.string.isRequired
};

const SpacesTable = ({ spaceNames, apiName, data, totalUsage, colours }) => {
  return (
    <Table data-test-id="api-usage-table">
      <TableHead>
        <TableRow>
          <TableCell>Space</TableCell>
          <TableCell>{apiName}</TableCell>
          <TableCell>API %</TableCell>
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
          />
        ))}
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
