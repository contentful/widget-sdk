import React, { useState } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { TextInput, Pill } from '@contentful/forma-36-react-components';
import isHotkey from 'is-hotkey';
import TagEditorConstraints from './TagEditorConstraints.es6';

const styles = {
  dropContainer: css({
    display: 'flex',
    flexWrap: 'wrap'
  }),
  dragContainer: css({
    display: 'inline-block',
    marginRight: tokens.spacingM,
    marginBottom: tokens.spacingM
  }),
  input: css({
    marginTop: tokens.spacingS,
    marginBottom: tokens.spacingM
  })
};

function TagEditor(props) {
  const [value, setValue] = useState('');

  const { isDisabled, onRemove, onRemoveLast, items, constraints, constraintsType } = props;

  return (
    <div data-test-id="tag-editor-container">
      <TextInput
        testId="tag-editor-input"
        extraClassNames={styles.input}
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

      <div className={styles.dropContainer}>
        {items.map((item, index) => {
          return (
            <div key={item + index} className={styles.dragContainer}>
              <Pill
                data-test-id="tag-editor-pill"
                status="primary"
                label={item}
                onClose={() => {
                  if (!isDisabled) {
                    if (items.length === 1) {
                      onRemoveLast();
                    } else {
                      onRemove(index);
                    }
                  }
                }}
              />
            </div>
          );
        })}
      </div>
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
  isDisabled: PropTypes.bool.isRequired
};

export default TagEditor;
