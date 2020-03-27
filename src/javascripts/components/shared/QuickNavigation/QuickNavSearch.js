import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import isHotkey from 'is-hotkey';
import { throttle, get } from 'lodash';
import Downshift from 'downshift';
import { TextInput, Spinner } from '@contentful/forma-36-react-components';
import { ResultList } from './ResultList';
import { getSearchResults } from './utils';
import { trackSelectedItem } from './analytics';
import { go, href } from 'states/Navigator';

const styles = {
  dropdownContainer: css({
    width: '560px',
  }),
  inputContainer: css({
    position: 'relative',
  }),
  spinnerLoading: css({
    position: 'absolute',
    top: '9px',
    right: '9px',
    zIndex: '20',
  }),
};

export default class QuickNavSearch extends React.Component {
  state = {
    items: [],
    query: '',
    isLoading: false,
  };

  inputRef = React.createRef();

  componentDidMount() {
    this.mounted = true;
    this.inputRef.current.focus();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  hotKeyHandler = (event, highlightedItem) => {
    if (highlightedItem) {
      if (isHotkey('mod+enter', event) && highlightedItem) {
        window.open(href(highlightedItem.link), '_blank');
        this.props.closeModal();
      } else if (isHotkey('enter', event)) {
        go(highlightedItem.link);
        this.props.closeModal();
      }
    }
  };

  onQueryUpdate = async (query) => {
    this.setState({ isLoading: true, query });
    const items = await getSearchResults(query);
    this.mounted && this.setState({ items, isLoading: false });
  };

  onQueryUpdateThrottled = throttle(this.onQueryUpdate, 1000, { trailing: true });

  render() {
    const { closeModal } = this.props;
    const { items, isLoading, query } = this.state;

    return (
      <Downshift
        itemToString={(item) => get(item, 'title', '')}
        onInputValueChange={this.onQueryUpdateThrottled}
        onChange={trackSelectedItem}>
        {({ getInputProps, getItemProps, isOpen, highlightedIndex }) => (
          <div className={styles.dropdownContainer}>
            <div className={styles.inputContainer}>
              <TextInput
                {...getInputProps({
                  onKeyDown: (e) => {
                    const highlightedItem = items[highlightedIndex];
                    this.hotKeyHandler(e, highlightedItem, query);
                  },
                })}
                testId="quick-nav-search-input"
                placeholder="Quick search - search for entries, assets and content types"
                inputRef={this.inputRef}
              />
              {isLoading && <Spinner className={styles.spinnerLoading} />}
            </div>
            {isOpen && (
              <ResultList
                items={items}
                highlightedIndex={highlightedIndex}
                closeModal={closeModal}
                getItemProps={getItemProps}
                query={query}
                isLoading={isLoading}
              />
            )}
          </div>
        )}
      </Downshift>
    );
  }
}

QuickNavSearch.propTypes = {
  closeModal: PropTypes.func,
};
