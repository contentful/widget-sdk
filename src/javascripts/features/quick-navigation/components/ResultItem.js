import React from 'react';
import PropTypes from 'prop-types';
import { startCase } from 'lodash';
import { css, cx } from 'emotion';
import { Tag, Icon } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { stateName, getState } from 'data/CMA/EntityState';
import { EntityStatusTag } from 'components/shared/EntityStatusTag';
import StateLink from 'app/common/StateLink';
import { ResultItemIcon } from './ResultItemIcon';

const styles = {
  item: css({ padding: 0, margin: 0 }),
  highlightedItem: css({
    backgroundColor: tokens.colorElementLight,
  }),
  entityLink: css({
    color: tokens.colorTextDark,
    display: 'flex',
    flexWrap: 'nowrap',
    alignItems: 'center',
    padding: '10px 10px 10px 0',
  }),
  entityLinkLabel: css({
    color: tokens.colorTextDark,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '80%',
  }),
  contentTypeLabel: css({
    margin: '10px',
    color: tokens.colorTextLightest,
    fontSize: tokens.fontSizeS,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: '20px',
  }),
  seeMoreLabel: css({ color: tokens.colorBlueDark }),
  seeMoreItem: css({
    boxSizing: 'border-box',
    borderBottom: `1px solid ${tokens.colorTextLightest}`,
  }),
  entityStatusTag: css({
    marginLeft: 'auto',
  }),
  searchLinkItem: css({
    backgroundColor: tokens.colorElementLightest,
    textAlign: 'center',
    borderBottom: `3px solid ${tokens.colorElementLight}`,
  }),
  highlightedSearchItem: css({
    backgroundColor: tokens.colorElementLight,
    textAlign: 'center',
    borderBottom: `3px solid ${tokens.colorElementMid}`,
    '> a': { color: tokens.colorTextDark },
  }),
};

const EntityListItem = ({ item, index, highlightedIndex, closeModal, getItemProps }) => (
  <li
    key={item.sys.id}
    {...getItemProps({
      key: item.sys.id,
      item,
      className: highlightedIndex === index ? cx(styles.highlightedItem, styles.item) : styles.item,
    })}>
    <StateLink
      path={item.link.path}
      params={item.link.params}
      onClick={closeModal}
      className={styles.entityLink}>
      <ResultItemIcon type={item.type} />
      <span className={styles.entityLinkLabel}>{item.title}</span>
      {item.type == 'entries' && (
        <span className={styles.contentTypeLabel}>{startCase(item.contentType)}</span>
      )}
      {(item.type == 'assets' || item.type == 'entries') && (
        <div className={styles.entityStatusTag}>
          <EntityStatusTag statusLabel={stateName(getState(item.sys))} />
        </div>
      )}
      {item.type === 'content_types' && (
        <div className={styles.entityStatusTag}>
          <Tag tagType="positive">active</Tag>
        </div>
      )}
    </StateLink>
  </li>
);

const SearchLinkListItem = ({ item, getItemProps, highlightedIndex, index, closeModal }) => {
  return (
    <li
      key={index}
      {...getItemProps({
        item,
        className:
          highlightedIndex === index
            ? cx(styles.highlightedItem, styles.item, styles.seeMoreItem)
            : cx(styles.item, styles.seeMoreItem),
      })}>
      <StateLink
        path={item.link.path}
        params={item.link.params}
        onClick={closeModal}
        className={styles.entityLink}>
        <ResultItemIcon type={item.linkType} />
        <span className={styles.seeMoreLabel}>
          See all {item.total} {item.title}
        </span>
        <div className={styles.entityStatusTag}>
          <Icon icon="ChevronRight" />
        </div>
      </StateLink>
    </li>
  );
};

export const ResultItem = ({ item, index, highlightedIndex, closeModal, getItemProps, query }) => {
  if (!item) {
    return null;
  }

  return item.type === 'search_link' ? (
    <SearchLinkListItem
      item={item}
      index={index}
      highlightedIndex={highlightedIndex}
      getItemProps={getItemProps}
      closeModal={closeModal}
      query={query}
    />
  ) : (
    <EntityListItem
      item={item}
      index={index}
      highlightedIndex={highlightedIndex}
      closeModal={closeModal}
      getItemProps={getItemProps}
    />
  );
};

ResultItem.propTypes = {
  item: PropTypes.any,
  index: PropTypes.number,
  highlightedIndex: PropTypes.number,
  closeModal: PropTypes.func,
  getItemProps: PropTypes.func,
  query: PropTypes.string,
};

EntityListItem.propTypes = SearchLinkListItem.propTypes = ResultItem.propTypes;
