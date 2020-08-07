import React from 'react';
import { css } from 'emotion';

import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@contentful/forma-36-react-components';

const styles = {
  column: css({
    width: '18.75%',
  }),
};

export const SpaceLimitsTable = () => {
  return (
    <Table>
      <colgroup>
        <col />
        <col className={styles.column} />
        <col className={styles.column} />
        <col className={styles.column} />
        <col className={styles.column} />
      </colgroup>
      <TableHead>
        <TableRow>
          <TableCell />
          <TableCell>Community</TableCell>
          <TableCell>Team - Medium</TableCell>
          <TableCell>Team - Large</TableCell>
          <TableCell>Enterprise</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>Locales</TableCell>
          <TableCell>2</TableCell>
          <TableCell>7</TableCell>
          <TableCell>10</TableCell>
          <TableCell>30+</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Environments</TableCell>
          <TableCell>1 master {'&'} 3 sandbox</TableCell>
          <TableCell>1 master {'&'} 3 sandbox</TableCell>
          <TableCell>1 master {'&'} 5 sandbox</TableCell>
          <TableCell>10+</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Content types</TableCell>
          <TableCell>48</TableCell>
          <TableCell>48</TableCell>
          <TableCell>48</TableCell>
          <TableCell>96+</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Assets {'&'} entries</TableCell>
          <TableCell>25,000</TableCell>
          <TableCell>25,000</TableCell>
          <TableCell>50,000</TableCell>
          <TableCell>100,000+</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Roles</TableCell>
          <TableCell>Admin {'&'} Editor</TableCell>
          <TableCell>Admin {'&'} Editor</TableCell>
          <TableCell>Admin, Editor, Author {'&'} Translators</TableCell>
          <TableCell>Admin, Editor, Author, Translators, Freelance {'&'} Custom</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Prices</TableCell>
          <TableCell>Free</TableCell>
          <TableCell>$489</TableCell>
          <TableCell>$879</TableCell>
          <TableCell>Custom</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
