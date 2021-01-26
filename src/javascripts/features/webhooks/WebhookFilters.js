import React from 'react';
import PropTypes from 'prop-types';
import {
  FormLabel,
  Paragraph,
  Select,
  Option,
  TextInput,
  TextLink,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import { CONSTRAINT_TYPES, CONSTRAINT_NAMES, PATH_VALUES, PATHS } from './WebhookFiltersState';

const PATH_TITLES = {
  [PATH_VALUES.ENVIRONMENT]: 'Environment ID',
  [PATH_VALUES.CONTENT_TYPE]: 'Content Type ID',
  [PATH_VALUES.ENTITY]: 'Entity ID',
};

const NO_FILTERS_MSG =
  'No filters defined. This webhook will trigger for any entity, based on your selection of triggering events.';
const HAS_FILTERS_MSG =
  'This webhook will trigger only for entities matching the filters defined below.';

const styles = {
  addFilterLink: css({
    textDecoration: 'underline',
  }),
  webhookLabel: css({
    display: 'block',
  }),
  filtersParagraph: css({
    marginBottom: tokens.spacingM,
  }),
};

export class WebhookFilters extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    filters: PropTypes.array.isRequired,
  };

  componentDidUpdate() {
    if (this.shouldFocus && this.el) {
      const inputs = this.el.querySelectorAll('input');
      inputs[inputs.length - 1].focus(); // focus the value of the last filter
    }
    this.shouldFocus = false;
  }

  addNew() {
    this.shouldFocus = true; // focus newly added filter when updated
    const { filters, onChange } = this.props;
    const newlyAdded = { constraint: 0, path: PATH_VALUES.ENVIRONMENT, value: '' };
    const updated = filters.concat([newlyAdded]);
    onChange(updated);
  }

  updateByIndex(index, updateObj) {
    const { filters, onChange } = this.props;
    const updated = [...filters];
    updated[index] = { ...updated[index], ...updateObj };
    onChange(updated);
  }

  removeByIndex(index) {
    const { filters, onChange } = this.props;
    const updated = filters.slice(0, index).concat(filters.slice(index + 1));
    onChange(updated);
  }

  renderConstraintOption(constraint, index) {
    let caption = constraint.name;
    if (constraint.negated) {
      caption = 'not ' + constraint.name;
    }

    return (
      <Option key={index} value={index}>
        {caption}
      </Option>
    );
  }

  renderFilter(filter, index) {
    return (
      <div key={index} data-test-id="filter-setting-row" className="webhook-editor__settings-row">
        <Select
          width={'auto'}
          className=""
          testId="filter-entity-type"
          value={filter.path}
          onChange={(e) => this.updateByIndex(index, { path: e.target.value })}>
          {PATHS.map((p) => (
            <Option key={p} value={p}>
              {PATH_TITLES[p]} ({p})
            </Option>
          ))}
        </Select>

        <Select
          width={'auto'}
          testId="filter-operation"
          value={filter.constraint}
          onChange={(e) => this.updateByIndex(index, { constraint: e.target.value })}>
          {CONSTRAINT_TYPES.map(this.renderConstraintOption)}
        </Select>

        <TextInput
          width={'medium'}
          placeholder={this.getPlaceholder(filter.constraint)}
          testId="filter-value"
          value={filter.value}
          onChange={(e) => this.updateByIndex(index, { value: e.target.value })}
        />

        <TextLink
          testId="remove-webhook-filter"
          className={styles.filterLink}
          onClick={() => this.removeByIndex(index)}>
          Remove
        </TextLink>
      </div>
    );
  }

  render() {
    const { filters } = this.props;

    return (
      <div
        className="cfnext-form__field"
        ref={(el) => {
          this.el = el;
        }}>
        <FormLabel className={styles.webhookLabel}>Filters</FormLabel>
        <Paragraph className={styles.filtersParagraph}>
          {filters.length > 0 ? HAS_FILTERS_MSG : NO_FILTERS_MSG}
        </Paragraph>

        {filters.map((f, i) => this.renderFilter(f, i))}

        <TextLink
          className={styles.filterLink}
          testId="add-webhook-filter"
          onClick={() => this.addNew()}>
          + Add filter
        </TextLink>
      </div>
    );
  }

  getPlaceholder(constraint) {
    if (CONSTRAINT_TYPES[constraint].name === CONSTRAINT_NAMES.IN) {
      return 'comma separated values';
    }

    if (CONSTRAINT_TYPES[constraint].name === CONSTRAINT_NAMES.REGEXP) {
      return 'valid regular expression, for example [a-z]+';
    }

    return '';
  }
}
