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

interface SecurityTagParams {
  isSecure: boolean;
  strike?: boolean;
}

function SecurityTag({ isSecure, strike }: SecurityTagParams) {
  const tagType = isSecure ? 'positive' : 'muted';
  const text = isSecure ? 'SECURE' : 'PUBLIC';

  return (
    <Tag tagType={tagType} className={strike ? styles.strike : undefined}>
      {text}
    </Tag>
  );
}
interface AssetUrlCellParams {
  current: boolean;
  selected: boolean;
}

function AssetUrlCell({ current, selected }: AssetUrlCellParams) {
  return (
    <>
      {current !== selected ? (
        <>
          {' '}
          <SecurityTag isSecure={current} strike /> &rarr;{' '}
        </>
      ) : null}
      <SecurityTag isSecure={selected} />
      {selected === true ? (
        <>
          &nbsp; <Icon icon="Lock" color="positive" className={styles.lockIcon} />
        </>
      ) : null}
    </>
  );
}

const levelToUrlSecurity = {
  [LEVEL.MIGRATING]: {
    cma: false,
    cpa: false,
    cda: false,
  },
  [LEVEL.UNPUBLISHED]: {
    cma: true,
    cpa: true,
    cda: false,
  },
  [LEVEL.ALL]: {
    cma: true,
    cpa: true,
    cda: true,
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
        <TableRow testId="embargoed-assets.cma">
          <TableCell>Management (CMA)</TableCell>
          <TableCell>
            <AssetUrlCell current={fromLevelSecurity.cma} selected={toLevelSecurity.cma} />
          </TableCell>
        </TableRow>
        <TableRow testId="embargoed-assets.cpa">
          <TableCell>Preview (CPA)</TableCell>
          <TableCell>
            <AssetUrlCell current={fromLevelSecurity.cpa} selected={toLevelSecurity.cpa} />
          </TableCell>
        </TableRow>
        <TableRow testId="embargoed-assets.cda">
          <TableCell>Delivery (CDA)</TableCell>
          <TableCell>
            <AssetUrlCell current={fromLevelSecurity.cda} selected={toLevelSecurity.cda} />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
