import React, { useState } from 'react';
import { noop } from 'lodash';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { TextInput, Pill, Icon } from '@contentful/forma-36-react-components';

import { sortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';
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
    marginRight: tokens.spacingS,
    marginBottom: tokens.spacingS
  }),
  handle: css({
    lineHeight: '1.5rem',
    padding: '0.375rem 0.625rem',
    paddingRight: 0,
    cursor: 'grab',
    userSelect: 'none',
    svg: {
      fill: tokens.colorTextLightest,
      verticalAlign: 'middle'
    }
  })
};

const SortableHandle = sortableHandle(() => (
  <div className={styles.handle}>
    <Icon icon="Drag" color="muted" />
  </div>
));

const SortablePill = sortableElement(({ label, isDisabled, index, onRemove }) => (
  <Pill
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
    dragHandleComponent={<SortableHandle />}
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
        useDragHandle
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
