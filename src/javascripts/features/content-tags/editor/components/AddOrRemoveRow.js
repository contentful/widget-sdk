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
  TextLink,
} from '@contentful/forma-36-react-components';
import { CHANGE_TYPE } from 'features/content-tags/editor/state/BulkTaggingProvider';
import { TagVisibility } from 'features/content-tags/core/components/TagVisibility';
import classNames from 'classnames';

const styles = {
  tag: css({ marginRight: tokens.spacing2Xs, marginBottom: tokens.spacing2Xs }),
  metaText: css({ lineHeight: '2.5rem', textAlign: 'right' }),
  tCell: css({ padding: 0, border: 'none', textAlign: 'right', verticalAlign: 'middle' }),
  pillCell: css({
    textAlign: 'left',
    div: css({
      marginBottom: '0px',
      marginTop: '0px',
    }),
  }),
  greyPill: css({
    background: tokens.colorElementMid,
    span: {
      color: tokens.colorTextBase,
    },
  }),
  appliedGreyPill: css({
    background: tokens.colorElementDark,
    button: css({
      '&:hover': {
        background: tokens.colorElementDarkest,
      },
      background: tokens.colorElementDark,
      borderColor: tokens.colorTextLightest,
      span: css({
        svg: css({
          fill: tokens.colorTextLightest,
        }),
      }),
    }),
  }),
  removedGreyPill: css({
    background: tokens.colorElementLight,
    textDecoration: 'line-through',
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

export const ACTION_LABELS = {
  APPLY_TO_ALL: 'Apply to all',
  UNDO: 'Undo',
  NONE: '',
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
        className.push(styles.greyPill, styles.appliedGreyPill);
        onClose = () => onPerformAction(tag.value, BULK_ACTION.REMOVE_TAG);
        break;
      case CHANGE_TYPE.REMOVED:
        className.push(styles.greyPill, styles.removedGreyPill);
        break;
      case CHANGE_TYPE.ALL:
        onClose = () => onPerformAction(tag.value, BULK_ACTION.REMOVE_TAG);
        className.push(styles.greyPill, styles.appliedGreyPill);
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

  const renderButton = (label) => {
    switch (label) {
      case ACTION_LABELS.APPLY_TO_ALL:
        return <TextLink onClick={onClick}>{label}</TextLink>;
      case ACTION_LABELS.UNDO:
        return (
          <Button buttonType="muted" onClick={onClick} size="small">
            {label}
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <TableRow>
      <TableCell className={classNames(styles.tCell, styles.pillCell, styles.row1)}>
        <Pill key={tag.value} label={tag.label} {...pillProps()} />
        <TagVisibility
          visibility={tag.visibility}
          disabled={changeType === CHANGE_TYPE.REMOVED}
          showTooltip={true}
        />
      </TableCell>
      <TableCell className={classNames(styles.tCell, styles.row2)}>{renderButton(label)}</TableCell>
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
    visibility: PropTypes.string,
  }),
  label: PropTypes.string,
  meta: PropTypes.string,
  onAction: PropTypes.func,
  style: PropTypes.object,
  changeType: PropTypes.string,
};

export { AddOrRemoveRow };
