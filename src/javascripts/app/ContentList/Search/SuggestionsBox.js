/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import { get } from 'lodash';
import tokens from '@contentful/forma-36-tokens';
import Keys from './Keys';
import PropTypes from 'prop-types';
import { truncate } from 'utils/StringUtils';
import InfoIcon from 'svg/info.svg';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

// Suggestions
// -----------
export default function SuggestionsBox({
  items,
  searchTerm,
  onSelect,
  onKeyUp,
  onKeyDown,
  hideSuggestions,
  selectedSuggestion,
}) {
  let lastFocused = -1;
  const suggestions = items.map((field, index) => {
    const key = `${get(field, 'contentType.id', 'none')}::${field.queryKey}`;
    return (
      <div
        className="search-next__completion-item"
        key={key}
        data-test-id={key}
        tabIndex="0"
        onBlur={() => {
          if (lastFocused === selectedSuggestion) {
            hideSuggestions();
            lastFocused = -1;
          } else {
            lastFocused = selectedSuggestion;
          }
        }}
        ref={(el) => {
          if (selectedSuggestion === index && el) {
            el.focus();
          }
        }}
        onMouseDown={() => {
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
  selectedSuggestion: PropTypes.number,
  hideSuggestions: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
  onKeyDown: PropTypes.func,
  onKeyUp: PropTypes.func,
};

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'search-help-banner',
  campaign: 'in-app-help',
});

const SearchHelpBanner = () => (
  <div
    onMouseDown={(e) => e.preventDefault()}
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
        href={withInAppHelpUtmParams('https://www.contentful.com/help/content-search/')}
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
        data-test-id="suggestions"
        style={{
          zIndex: 1,
          border: `solid ${tokens.colorBlueMid}`,
          borderWidth: '0 1px 1px 1px',
          background: 'white',
        }}>
        {hasSuggestions ? (
          <div
            onMouseDown={(e) => e.preventDefault()}
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
        ) : (
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
