import { Spinner } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { Operator } from 'core/services/ContentQuery';
import { css } from 'emotion';
import {
  TagsMultiSelectAutocomplete,
  tagsPayloadToOptions,
  useFilteredTags,
  useReadTags,
} from 'features/content-tags';
import { noop } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo } from 'react';

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

  static getDerivedStateFromProps(nextProps) {
    const { value, selectedTags } = nextProps;
    return {
      value,
      selectedTags,
    };
  }

  state = {
    value: '',
    selectedTags: [],
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
  const { isLoading, error, getTag, data } = useReadTags();
  const { setSearch } = useFilteredTags();
  const { value } = props;
  const onSearch = useCallback(
    (tagId) => {
      setSearch(tagId);
    },
    [setSearch]
  );

  const selectedTagIds = value.split(',').map((id) => id.trim());

  const selectedTags = useMemo(() => {
    return tagsPayloadToOptions(selectedTagIds.map(getTag).filter(Boolean));
  }, [selectedTagIds, getTag]);

  const allTags = useMemo(() => {
    return tagsPayloadToOptions(data);
  }, [data]);

  if (isLoading === false && !error) {
    // Normalize incoming tags and use them as initial state
    // missing tags are thrown out...

    // we are making sure that the user will see all (tags > limit) the selected on top
    return (
      <MetadataTag tags={allTags} selectedTags={selectedTags} onSearch={onSearch} {...props} />
    );
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
