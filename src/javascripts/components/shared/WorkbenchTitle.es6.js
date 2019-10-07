import React from 'react';
import { Heading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase.es6';

const styles = {
  wrapper: css({
    flexShrink: 1,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    margin: `0 ${tokens.spacingM} 0 0.1ex`,
    padding: '5px 0'
  }),
  heading: css({
    fontSize: tokens.fontSizeXl,
    whiteSpace: 'nowrap',
    lineHeight: tokens.spacingM
  }),
  contentType: css({
    lineHeight: tokens.lineHeightDefault,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    color: tokens.colorTextMid
  }),
  locale: css({
    color: tokens.colorTextLight,
    fontWeight: tokens.fontWeightNormal
  }),
  knowledgeBase: css({
    marginLeft: tokens.spacingS
  })
};

export default function WorkbenchTitle({
  title,
  localeName,
  contentTypeName,
  isSingleLocaleModeOn
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.contentType}>{contentTypeName}</div>
      <Heading className={styles.heading}>
        {title}
        {isSingleLocaleModeOn && <span className={styles.locale}> - {localeName}</span>}
        <KnowledgeBase target="entry" className={styles.knowledgeBase} />
      </Heading>
    </div>
  );
}

WorkbenchTitle.propTypes = {
  title: PropTypes.string,
  localeName: PropTypes.string,
  contentTypeName: PropTypes.string,
  isSingleLocaleModeOn: PropTypes.bool
};
