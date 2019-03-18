export const RICH_TEXT_COMMANDS_CONTEXT_MARK_TYPE = 'richTextCommandsContext';

/**
 * @description
 * Tests the editor change value selection for a forward slash and
 * slices the following string to be used as command and creates a slate decoration
 * to visualize the command.
 *
 * @param {object} value
 * @returns {object}
 */
export const testForCommands = value => {
  if (!value.startText) {
    return null;
  }
  // matches the character / literally (case sensitive)
  const COMMAND_REGEX = /\/(\S*)$/;
  const startOffset = value.selection.start.offset;
  const textBefore = value.startText.text.slice(0, startOffset);
  const result = COMMAND_REGEX.exec(textBefore);
  const inputValue = result === null ? null : result[1] || result[0];

  if (inputValue !== this.lastInputValue) {
    this.lastInputValue = inputValue;

    const { selection } = value;

    let decorations = value.decorations.filter(
      value => value.mark.type !== RICH_TEXT_COMMANDS_CONTEXT_MARK_TYPE
    );

    if (inputValue) {
      decorations = decorations.push({
        anchor: {
          key: selection.start.key,
          offset: selection.start.offset - (inputValue.length + 1)
        },
        focus: {
          key: selection.start.key,
          offset: selection.start.offset
        },
        mark: {
          type: RICH_TEXT_COMMANDS_CONTEXT_MARK_TYPE
        }
      });
    }
    return { decorations, value: inputValue, selection };
  }
  return null;
};

export const removeCommand = (editor, selection, command) => {
  editor.removeTextByKey(
    selection.start.key,
    selection.start.offset - (command.length + 1),
    command.length + 1
  );
};
