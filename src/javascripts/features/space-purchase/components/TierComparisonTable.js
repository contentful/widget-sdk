import React from 'react';
import { css } from 'emotion';

import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@contentful/forma-36-react-components';

import { websiteUrl } from 'Config';
import ExternalTextLink from 'app/common/ExternalTextLink';

const styles = {
  column: css({
    width: '25%',
  }),
};

export const TierComparisonTable = () => {
  return (
    <Table>
      <colgroup>
        <col />
        <col className={styles.column} />
        <col className={styles.column} />
        <col className={styles.column} />
      </colgroup>
      <TableHead>
        <TableRow>
          <TableCell />
          <TableCell>Community Tier</TableCell>
          <TableCell>Team Tier</TableCell>
          <TableCell>Enterprise Tier</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>User limit</TableCell>
          <TableCell>10</TableCell>
          <TableCell>25 (10 free {'&'} 15 paid)</TableCell>
          <TableCell>Unlimited</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Asset size limit</TableCell>
          <TableCell>50MB</TableCell>
          <TableCell>1000MB</TableCell>
          <TableCell>Unlimited</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>API calls</TableCell>
          <TableCell>2,000,000 (hard limit)</TableCell>
          <TableCell>2,000,000 (plus overages)</TableCell>
          <TableCell>7,000,000 (no overages)</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Support</TableCell>
          <TableCell>
            <ExternalTextLink href={websiteUrl('help/')}>Self-service only</ExternalTextLink>
          </TableCell>
          <TableCell>Standard support</TableCell>
          <TableCell>Guarenteed response time</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
