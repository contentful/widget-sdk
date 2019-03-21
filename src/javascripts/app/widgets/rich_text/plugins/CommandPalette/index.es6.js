import React from 'react';

import { getDecorationOrDefault, hasCommandPaletteMarkType } from './Util.es6';
import CommandPalette from './CommandPalette.es6';
import CommandMark from './CommandMark.es6';

export const CommandPalettePlugin = widgetAPI => ({
  decorateNode: (_node, editor, next) => {
    const others = next();

    const decoration = getDecorationOrDefault(editor);

    if (decoration) {
      return [...others, decoration];
    }

    return [...others];
  },
  renderMark: (props, editor, next) => {
    if (hasCommandPaletteMarkType(props.mark.type)) {
      return (
        <CommandMark attributes={props.attributes} editor={editor}>
          {props.children}
        </CommandMark>
      );
    }
    return next();
  },
  renderEditor: (_props, editor, next) => {
    const children = next();
    return (
      <React.Fragment>
        {children}
        <CommandPalette
          anchor={editor.state.commandMark}
          value={editor.value}
          editor={editor}
          widgetAPI={widgetAPI}
          onClose={() => {
            this.setState({ currentCommand: null });
          }}
        />
      </React.Fragment>
    );
  }
});
