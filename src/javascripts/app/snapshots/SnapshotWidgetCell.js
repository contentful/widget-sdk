import React from 'react';
import PropTypes from 'prop-types';
import { RadioButton, Icon } from '@contentful/forma-36-react-components';
import { SNAPSHOT, CURRENT } from './utils';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const commonOverlayStyles = {
  zIndex: 150,
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const styles = {
  cell: css({
    maxWidth: '50%',
    display: 'flex',
    flex: '1 0',
    '&:first-child': {
      borderRight: '1px solid #dbdbdb',
    },
    position: 'relative',
    borderBottom: '1px solid #eee',
  }),
  cellPresenter: css({
    flexGrow: 1,
    padding: tokens.spacing3Xl,
    paddingLeft: 0,
    maxWidth: `calc(100% - ${tokens.spacing3Xl})`,
  }),
  fieldTitle: css({
    display: 'flex',
    color: tokens.colorTextLight,
    marginBottom: '0.642857142857143em',
    justifyContent: 'space-between',
  }),
  overlayDifferent: css({
    ...commonOverlayStyles,
    cursor: 'pointer',
    textAlign: 'center',
    '& > span': {
      display: 'none',
      padding: `${tokens.spacing2Xs} ${tokens.spacingXs}`,
      fontSize: tokens.spacingS,
      fontWeight: tokens.fontWeightNormal,
      letterSpacing: '1px',
      textTransform: 'uppercase',
      background: tokens.colorBlueMid,
      color: tokens.colorWhite,
    },
  }),
  overlayIdentical: css({
    ...commonOverlayStyles,
    background: 'rgba(255,255,255,0.75)',
  }),
  selected: css({
    '& > span': {
      display: 'inline-block !important',
    },
    zIndex: 151,
    border: ` 1px solid ${tokens.colorBlueMid}`,
    backgroundColor: 'rgba(91,159,239,0.05)',
    top: '-1px',
    left: '-1px',
    right: '-1px',
    bottom: '-1px',
  }),
  radio: css({
    minWidth: tokens.spacing3Xl,
    maxWidth: tokens.spacing3Xl,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }),
  noPermissionInfo: css({
    marginLeft: 'auto',
    whiteSpace: 'nowrap',
    display: 'flex',
    '& > i': {
      display: 'icon-block',
      marginRight: tokens.spacingS,
      fill: tokens.colorTextLight,
    },
  }),
};

const SnapshotWidgetCell = ({
  canRestore,
  fieldName,
  isDisabled,
  isSelected,
  onSelect,
  version,
  children,
}) => {
  const mainTestId = `snapshots-comparator-${version}`;
  return (
    <div className={styles.cell} data-test-id={mainTestId}>
      <div className={styles.radio}>
        <RadioButton checked={isSelected} labelText={`Select ${version} version of field`} />
      </div>
      <div className={styles.cellPresenter}>
        <div className={styles.fieldTitle} data-test-id={`${mainTestId}-field-title`}>
          <div>{fieldName}</div>
          {isDisabled && (
            <div className={styles.noPermissionInfo}>
              <Icon icon="Lock" />
              This field is disabled
            </div>
          )}
        </div>
        {children}
        {canRestore ? (
          <div
            data-test-id={`${mainTestId}-selector-${isSelected ? 'selected' : 'unselected'}`}
            className={
              isSelected ? `${styles.overlayDifferent} ${styles.selected}` : styles.overlayDifferent
            }
            onClick={onSelect}>
            {version === SNAPSHOT && <span>Field will be restored to this version</span>}
          </div>
        ) : (
          <div className={styles.overlayIdentical} />
        )}
      </div>
    </div>
  );
};

SnapshotWidgetCell.propTypes = {
  children: PropTypes.element.isRequired,
  canRestore: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isSelected: PropTypes.bool,
  fieldName: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  version: PropTypes.oneOf([SNAPSHOT, CURRENT]).isRequired,
};

export default SnapshotWidgetCell;
