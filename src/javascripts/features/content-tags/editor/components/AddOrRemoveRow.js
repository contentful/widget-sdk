import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Button,
  Paragraph,
  Pill,
  TableCell,
  TableRow,
} from '@contentful/forma-36-react-components';
import { CHANGE_TYPE } from 'features/content-tags/editor/state/BulkTaggingProvider';
import classNames from 'classnames';

const styles = {
  tag: css({ marginRight: tokens.spacing2Xs, marginBottom: tokens.spacing2Xs }),
  metaText: css({ lineHeight: '2.5rem', textAlign: 'right' }),
  tCell: css({ padding: 0, border: 'none', textAlign: 'right', verticalAlign: 'middle' }),
  pillCell: css({
    textAlign: 'left',
    div: css({
      margin: '0px 0px',
    }),
  }),
  orangePill: css({
    background: tokens.colorOrangeMid,
    span: {
      color: tokens.colorTextDark,
    },
  }),
  appliedOrangePill: css({
    button: css({
      '&:hover': {
        background: tokens.colorOrangeMid,
        opacity: 0.5,
      },
      borderColor: tokens.colorTextMid,
      span: css({
        svg: css({
          fill: tokens.colorTextDark,
        }),
      }),
    }),
  }),
  removedOrangePill: css({
    opacity: 0.5,
  }),
  row1: css({
    width: '60%',
  }),
  row2: css({
    width: '20%',
  }),
  row3: css({
    width: '20%',
  }),
};

export const BULK_ACTION = {
  REMOVE_TAG: 'REMOVE_TAG',
  ALL_TAG: 'ALL_TAG',
  RESET_TAG: 'RESET_TAG',
  ADD_TAG: 'ADD_TAG',
};

const AddOrRemoveRow = ({ tag, label, meta, onAction, changeType, style }) => {
  const onPerformAction = useCallback((tagId, action) => onAction(tagId, action), [onAction]);

  const onClick = () => {
    if (changeType === CHANGE_TYPE.NONE) {
      onPerformAction(tag.value, BULK_ACTION.ALL_TAG);
    } else if (changeType === CHANGE_TYPE.REMOVED) {
      onPerformAction(tag.value, BULK_ACTION.RESET_TAG);
    } else if (changeType === CHANGE_TYPE.NEW) {
      onPerformAction(tag.value, BULK_ACTION.REMOVE_TAG);
    } else if (changeType === CHANGE_TYPE.ALL) {
      onPerformAction(tag.value, BULK_ACTION.RESET_TAG);
    }
  };

  const pillProps = () => {
    const className = [styles.tag];
    let onClose;
    if (style) {
      className.push(style);
    }

    switch (changeType) {
      case CHANGE_TYPE.NEW:
        className.push(styles.orangePill, styles.appliedOrangePill);
        onClose = () => onPerformAction(tag.value, BULK_ACTION.REMOVE_TAG);
        break;
      case CHANGE_TYPE.REMOVED:
        className.push(styles.orangePill, styles.removedOrangePill);
        break;
      case CHANGE_TYPE.ALL:
        onClose = () => onPerformAction(tag.value, BULK_ACTION.REMOVE_TAG);
        className.push(styles.orangePill, styles.appliedOrangePill);
        break;
      default:
        onClose = () => onPerformAction(tag.value, BULK_ACTION.REMOVE_TAG);
        break;
    }

    return {
      onClose,
      className: classNames(className),
    };
  };

  return (
    <TableRow>
      <TableCell className={classNames(styles.tCell, styles.pillCell, styles.row1)}>
        <Pill key={tag.value} label={tag.label} {...pillProps()} />
      </TableCell>
      <TableCell className={classNames(styles.tCell, styles.row2)}>
        {label && (
          <Button buttonType="naked" onClick={onClick} size="small">
            {label}
          </Button>
        )}
      </TableCell>
      <TableCell className={classNames(styles.tCell, styles.row3)}>
        <div>
          <div>
            <Paragraph className={styles.metaText}> {meta} </Paragraph>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

AddOrRemoveRow.propTypes = {
  tag: PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.string,
  }),
  label: PropTypes.string,
  meta: PropTypes.string,
  onAction: PropTypes.func,
  changeType: PropTypes.string,
  style: PropTypes.object,
};

export { AddOrRemoveRow };
