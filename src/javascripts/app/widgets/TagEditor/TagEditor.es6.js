import React, { useState } from 'react';
import { noop } from 'lodash';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { TextInput, Pill } from '@contentful/forma-36-react-components';

import { sortableContainer, sortableElement } from 'react-sortable-hoc';
import arraySwap from 'utils/arraySwap.es6';
import isHotkey from 'is-hotkey';
import TagEditorConstraints from './TagEditorConstraints.es6';

const styles = {
  dropContainer: css({
    whiteSpace: 'nowrap',
    display: 'flex',
    flexWrap: 'wrap'
  }),
  input: css({
    marginTop: tokens.spacingS,
    marginBottom: tokens.spacingM
  }),
  pill: css({
    cursor: 'grab',
    userSelect: 'none',
    maxWidth: 200,
    marginRight: tokens.spacingS,
    marginBottom: tokens.spacingS
  })
};

const SortablePill = sortableElement(({ label, isDisabled, index, onRemove }) => (
  <Pill
    tabIndex={0}
    testId="tag-editor-pill"
    className={styles.pill}
    status="primary"
    label={label}
    onClose={() => {
      if (!isDisabled) {
        onRemove(index);
      }
    }}
    onDrag={noop}
  />
));

const SortableContainer = sortableContainer(({ children }) => (
  <div className={styles.dropContainer}>{children}</div>
));

function TagEditor(props) {
  const [value, setValue] = useState('');

  const { isDisabled, onRemove, onRemoveLast, items, constraints, constraintsType } = props;

  return (
    <div data-test-id="tag-editor-container">
      <TextInput
        testId="tag-editor-input"
        className={styles.input}
        disabled={isDisabled}
        type="text"
        value={value}
        placeholder="Type the value and hit enter"
        onKeyDown={e => {
          if (value && isHotkey('enter', e)) {
            props.onAdd(value);
            setValue('');
          }
        }}
        onChange={e => {
          setValue(e.target.value);
        }}
      />
      <SortableContainer
        axis="xy"
        distance={10}
        onSortEnd={({ oldIndex, newIndex }) => {
          props.onUpdate(arraySwap(props.items, oldIndex, newIndex));
        }}>
        {items.map((item, index) => {
          return (
            <SortablePill
              label={item}
              index={index}
              key={item + index}
              isDisabled={isDisabled}
              onRemove={items.length === 1 ? onRemoveLast : onRemove}
            />
          );
        })}
      </SortableContainer>
      {constraints && (
        <TagEditorConstraints constraints={constraints} constraintsType={constraintsType} />
      )}
    </div>
  );
}

TagEditor.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  constraintsType: PropTypes.string,
  constraints: PropTypes.object,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onRemoveLast: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool.isRequired,
  onUpdate: PropTypes.func.isRequired
};

export default TagEditor;
