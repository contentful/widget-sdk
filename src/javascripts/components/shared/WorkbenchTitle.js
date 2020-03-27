import React from 'react';
import { Heading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import LinkedEntitiesBadge from 'app/entity_editor/Components/FetchLinksToEntity/LinkedEntitiesBadge.js';

const styles = {
  wrapper: css({
    flexShrink: 1,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    marginRight: tokens.spacingM,
    padding: `${tokens.spacing2Xs} 0`,
  }),
  heading: css({
    fontSize: tokens.fontSizeXl,
    whiteSpace: 'nowrap',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'flex-start',
  }),
  linkedEntitiesBadge: css({
    marginLeft: tokens.spacing2Xs,
  }),
  contentType: css({
    lineHeight: tokens.lineHeightDefault,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    color: tokens.colorTextMid,
  }),
  locale: css({
    color: tokens.colorTextLight,
    fontWeight: tokens.fontWeightNormal,
    marginLeft: tokens.spacing2Xs,
  }),
  knowledgeBase: css({
    marginLeft: tokens.spacingS,
  }),
};

export default function WorkbenchTitle({
  title,
  localeName,
  entityInfo,
  contentTypeName,
  isSingleLocaleModeOn,
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.contentType}>{contentTypeName}</div>
      <Heading className={styles.heading}>
        {title + ' '}
        {isSingleLocaleModeOn && <span className={styles.locale}> {`- ${localeName}`}</span>}
        <LinkedEntitiesBadge entityInfo={entityInfo} className={styles.linkedEntitiesBadge} />
      </Heading>
    </div>
  );
}

WorkbenchTitle.propTypes = {
  title: PropTypes.string,
  localeName: PropTypes.string,
  entityInfo: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }),
  contentTypeName: PropTypes.string,
  isSingleLocaleModeOn: PropTypes.bool,
};
