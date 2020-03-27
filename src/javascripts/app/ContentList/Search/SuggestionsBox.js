/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import { get } from 'lodash';
import tokens from '@contentful/forma-36-tokens';
import Keys from './Keys';
import PropTypes from 'prop-types';
import { truncate } from 'utils/StringUtils';
import InfoIcon from 'svg/info.svg';

// Suggestions
// -----------
export default function SuggestionsBox({
  items,
  searchTerm,
  defaultFocus,
  onSelect,
  onKeyUp,
  onKeyDown,
}) {
  const suggestions = items.map((field, index) => {
    return (
      <div
        className="search-next__completion-item"
        key={`${get(field, 'contentType.id', 'none')}::${field.queryKey}`}
        data-test-id={field.queryKey}
        tabIndex="0"
        ref={(el) => {
          if (defaultFocus.suggestionsFocusIndex === index && el) {
            el.focus();
          }
        }}
        onClick={() => {
          onSelect(field);
        }}
        onKeyUp={onKeyUp}
        onKeyDown={(e) => {
          if (Keys.enter(e)) {
            onSelect(field);
            e.stopPropagation();
          } else {
            onKeyDown(e);
          }
        }}>
        <div data-test-id="label" style={{ flex: '0 0 30%' }}>
          <div className="__filter-pill">{field.name}</div>
        </div>
        <div
          data-test-id="contentType"
          style={{
            color: tokens.colorTextLightest,
            flex: '0 0 30%',
          }}>
          {field.contentType ? field.contentType.name : 'All content types'}
        </div>
        <div
          data-test-id="description"
          style={{
            flex: '0 0 30%',
            color: tokens.colorTextLight,
          }}>
          {field.description}
        </div>
      </div>
    );
  });

  return (
    <SuggestionsList
      key={searchTerm}
      hasSuggestions={suggestions.length > 0}
      searchTerm={searchTerm}>
      {suggestions}
    </SuggestionsList>
  );
}

SuggestionsBox.propTypes = {
  items: PropTypes.array,
  searchTerm: PropTypes.string,
  defaultFocus: PropTypes.object,
  onSelect: PropTypes.func,
  onKeyDown: PropTypes.func,
  onKeyUp: PropTypes.func,
};

const SearchHelpBanner = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      background: tokens.colorIceMid,
      borderTop: '1px solid ' + tokens.colorElementLight,
      height: '56px',
      padding: '15px 20px',
    }}>
    <InfoIcon />
    <p
      style={{
        color: tokens.colorTextLight,
        margin: '0',
        marginLeft: '10px',
      }}>
      Get more out of search. Here’s{' '}
      <a
        style={{ textDecoration: 'underline' }}
        href="https://www.contentful.com/r/knowledgebase/content-search/"
        target="_blank"
        rel="noopener noreferrer">
        how search works
      </a>
    </p>
  </div>
);

class AutoHide extends React.Component {
  _isMounted = false;

  static propTypes = {
    ms: PropTypes.number.isRequired,
  };

  state = {
    isHidden: false,
  };

  componentDidMount() {
    this._isMounted = true;
    setTimeout(() => {
      this.hideComponent();
    }, this.props.ms);
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  hideComponent = () => {
    if (this._isMounted) {
      this.setState((previousState) => ({
        ...previousState,
        isHidden: true,
      }));
    }
  };

  render() {
    return this.state.isHidden ? null : this.props.children;
  }
}

class SuggestionsList extends React.Component {
  static propTypes = {
    searchTerm: PropTypes.string,
    hasSuggestions: PropTypes.bool.isRequired,
    children: PropTypes.node,
  };

  renderContent() {
    const { children, searchTerm, hasSuggestions } = this.props;
    return (
      <div
        tabIndex="0"
        data-test-id="suggestions"
        style={{
          zIndex: 1,
          border: `solid ${tokens.colorBlueMid}`,
          borderWidth: '0 1px 1px 1px',
          background: 'white',
        }}>
        {hasSuggestions && (
          <div
            style={{
              maxHeight: '50vh',
              overflowX: 'hidden',
              overflowY: 'auto',
            }}>
            <div className="search-next__suggestions-header">
              <div className="search-next__suggestions__column">Field</div>
              <div className="search-next__suggestions__column">Content type</div>
              <div className="search-next__suggestions__column">Description</div>
            </div>
            {children}
          </div>
        )}
        {!hasSuggestions && (
          <div className="search-next__suggestions__no-results">
            {`There are no filters matching “${truncate(searchTerm.trim(), 25)}”`}
          </div>
        )}
        <SearchHelpBanner />
      </div>
    );
  }

  render() {
    return this.props.hasSuggestions ? (
      this.renderContent()
    ) : (
      <AutoHide ms={1000}>{this.renderContent()}</AutoHide>
    );
  }
}
