import React from 'react';
import { LEVEL } from '../constants';
import {
  Icon,
  Table,
  TableHead,
  TableCell,
  TableBody,
  TableRow,
  Tag,
} from '@contentful/forma-36-react-components';
import { styles } from '../EmbargoedAssets.styles';

type Security = 'public' | 'secure';

interface SecurityTagParams {
  security: Security;
  strike?: boolean;
}

function SecurityTag({ security, strike }: SecurityTagParams) {
  switch (security) {
    case 'public':
      return (
        <Tag tagType="muted" className={strike ? styles.strike : undefined}>
          PUBLIC
        </Tag>
      );
    case 'secure':
      return (
        <Tag tagType="positive" className={strike ? styles.strike : undefined}>
          SECURE
        </Tag>
      );
    default:
      return null;
  }
}
interface AssetUrlCellParams {
  current: Security;
  selected: Security;
}

function AssetUrlCell({ current, selected }: AssetUrlCellParams) {
  return (
    <>
      {current !== selected ? (
        <>
          {' '}
          <SecurityTag security={current} strike /> &rarr;{' '}
        </>
      ) : null}
      <SecurityTag security={selected} />
      {selected === 'secure' ? (
        <>
          {' '}
          <Icon icon="Lock" color="positive" className={styles.lockIcon} />
        </>
      ) : null}
    </>
  );
}

const levelToUrlSecurity = {
  [LEVEL.MIGRATING]: {
    cma: 'public',
    cpa: 'public',
    cda: 'public',
  },
  [LEVEL.UNPUBLISHED]: {
    cma: 'secure',
    cpa: 'secure',
    cda: 'public',
  },
  [LEVEL.ALL]: {
    cma: 'secure',
    cpa: 'secure',
    cda: 'secure',
  },
};

interface LevelHelpTableParams {
  currentLevel: LEVEL;
  selectedLevel?: LEVEL;
}

export function LevelHelpTable({ currentLevel, selectedLevel }: LevelHelpTableParams) {
  const fromLevelSecurity = levelToUrlSecurity[currentLevel];
  const toLevelSecurity = levelToUrlSecurity[selectedLevel ?? currentLevel];

  return (
    <Table className={styles.table}>
      <TableHead>
        <TableRow>
          <TableCell testId="embargoed-assets.api" className={styles.tableFirstCol}>
            Name
          </TableCell>
          <TableCell testId="embargoed-assets.urls">Asset URLs</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow testId="embargoed-assets.1">
          <TableCell>Management (CMA)</TableCell>
          <TableCell>
            <AssetUrlCell current={fromLevelSecurity.cma} selected={toLevelSecurity.cma} />
          </TableCell>
        </TableRow>
        <TableRow testId="embargoed-assets.1">
          <TableCell>Preview (CPA)</TableCell>
          <TableCell>
            <AssetUrlCell current={fromLevelSecurity.cpa} selected={toLevelSecurity.cpa} />
          </TableCell>
        </TableRow>
        <TableRow testId="embargoed-assets.1">
          <TableCell>Delivery (CDA)</TableCell>
          <TableCell>
            <AssetUrlCell current={fromLevelSecurity.cda} selected={toLevelSecurity.cda} />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
