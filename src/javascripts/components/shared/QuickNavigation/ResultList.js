import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { HelpText } from '@contentful/forma-36-react-components';
import { getCtrlKey } from 'services/userAgent';
import { ResultItem } from './ResultItem';
import { MIN_QUERY_LENGTH } from './utils';

const styles = {
  noResults: css({
    padding: '5px',
    textAlign: 'center',
  }),
  dropdown: css({
    backgroundColor: tokens.colorWhite,
    width: '560px',
    borderBottomLeftRadius: '2px',
    borderBottomRightRadius: '2px',
  }),
  helpSection: css({
    display: 'flex',
    justifyContent: 'space-around',
    background: tokens.colorElementLightest,
    border: `1px solid ${tokens.colorElementDark}`,
    borderBottomLeftRadius: '2px',
    borderBottomRightRadius: '2px',
    color: tokens.colorTextMid,
    fontSize: tokens.fontSizeS,
    padding: '10px 5px',
  }),
  resultListContainer: css({
    maxHeight: '400px',
    overflow: 'auto',
  }),
};

export function ResultList({
  items,
  highlightedIndex,
  closeModal,
  getItemProps,
  query,
  isLoading,
}) {
  if (items.length) {
    return (
      <ul className={styles.dropdown}>
        <div className={styles.resultListContainer} data-test-id="quick-nav-result-list-container">
          {items.map((item, index) => (
            <ResultItem
              key={index}
              item={item}
              index={index}
              highlightedIndex={highlightedIndex}
              closeModal={closeModal}
              getItemProps={getItemProps}
              query={query}
            />
          ))}
        </div>
        <div className={styles.helpSection}>
          <HelpText>↑↓ to navigate</HelpText>
          <HelpText>↵ to open</HelpText>
          <HelpText>{getCtrlKey() === 'Cmd' ? '⌘' : 'ctrl'}+↵ to open in new tab</HelpText>
          <HelpText>esc to dismiss</HelpText>
        </div>
      </ul>
    );
  } else {
    return (
      !isLoading && (
        <div className={styles.dropdown}>
          <HelpText testId="empty-state-help-text" className={styles.noResults}>
            {query.trim().length < MIN_QUERY_LENGTH
              ? `Please enter at least ${MIN_QUERY_LENGTH} characters.`
              : !isLoading && 'No matches found. Did you spell it correctly?'}
          </HelpText>
        </div>
      )
    );
  }
}

ResultList.propTypes = {
  items: PropTypes.array,
  highlightedIndex: PropTypes.number,
  closeModal: PropTypes.func,
  getItemProps: PropTypes.func,
  query: PropTypes.string,
  isLoading: PropTypes.bool,
};
