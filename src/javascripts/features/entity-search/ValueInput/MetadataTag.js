import React from 'react';
import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { noop } from 'lodash';
import { Operator } from 'core/services/ContentQuery';
import {
  useReadTags,
  TagsMultiSelectAutocomplete,
  tagPayloadToValue,
  tagsPayloadToValues,
  orderByLabel,
  useFilteredTags,
} from 'features/content-tags';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Spinner } from '@contentful/forma-36-react-components';

/**
 * Renders text input in filter pill
 */
class MetadataTag extends React.Component {
  static propTypes = {
    operator: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    onSearch: PropTypes.func,
    setIsRemovable: PropTypes.func,
    tags: PropTypes.array,
    selectedTags: PropTypes.array,
    isFocused: PropTypes.bool,
  };

  static defaultProps = {
    onChange: noop,
  };

  state = {
    value: this.props.value,
    selectedTags: this.props.selectedTags,
  };

  onChange = (selectedTags) => {
    const value = selectedTags.map((tag) => tag.value).join(',');
    this.setState(() => ({ selectedTags, value }));
    this.props.onChange(value);
  };

  render() {
    const { tags, onSearch, setIsRemovable, operator, isFocused } = this.props;
    if (operator === Operator.EXISTS || operator === Operator.NOT_EXISTS) {
      return (
        <fieldset
          className={`search__input-text ${css({
            minWidth: tokens.spacingS,
          })}`}
        />
      );
    }

    return (
      <fieldset className="search__input-text">
        <TagsMultiSelectAutocomplete
          tags={tags}
          onChange={this.onChange}
          onQueryChange={onSearch}
          setIsRemovable={setIsRemovable}
          selectedTags={this.state.selectedTags}
          maxHeight={280}
          isFocused={isFocused}
          styles={{
            TagSummary: css({ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }),
            Autocomplete: css({
              left: 0,
              top: 18,
              zIndex: 200,
              position: 'absolute !important',
              width: 350,
            }),
          }}
        />
      </fieldset>
    );
  }
}

// Functional component to match old style search state
// with new style hook state
export const MetadataTagWrapper = (props) => {
  const { isLoading, error } = useReadTags();
  const { setSearch, filteredTags } = useFilteredTags();
  const { value } = props;
  const onSearch = useCallback(
    (tagId) => {
      setSearch(tagId);
    },
    [setSearch]
  );

  if (isLoading === false && !error) {
    // Normalize incoming tags and use them as initial state
    // missing tags are thrown out...
    const tags = orderByLabel(tagsPayloadToValues(filteredTags));

    const initialTags = value
      .split(',')
      .map((id) => id.trim())
      .map((id) => filteredTags.find((tag) => tag.sys.id === id))
      .filter(Boolean)
      .map(tagPayloadToValue);

    return <MetadataTag tags={tags} selectedTags={initialTags} onSearch={onSearch} {...props} />;
  }
  return (
    <fieldset className="search__input-text">
      <div
        className={css({
          marginLeft: tokens.spacingS,
          marginRight: tokens.spacingS,
        })}>
        <Spinner color="white" />
      </div>
    </fieldset>
  );
};

MetadataTagWrapper.propTypes = {
  value: PropTypes.string,
};
