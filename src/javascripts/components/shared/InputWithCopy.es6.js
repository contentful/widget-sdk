import {h} from 'ui/Framework';
import {noop} from 'lodash';
import {byName as colorByName} from 'Styles/Colors';
import domCopy from 'utils/DomClipboardCopy';

const copied = {};

export default function ({ children, text, onCopy = noop, id = text }, render) {
  const copyButton = h(`button.contextual-help__copy-button.fa.${copied[id] ? 'fa-check' : 'fa-copy'}`, {
    style: {
      height: '30px',
      width: '30px',
      position: 'absolute',
      bottom: '5px',
      right: '5px',
      backgroundColor: colorByName.elementLight,
      border: `1px solid ${colorByName.elementDark}`
    },
    onClick: copy
  });

  return h('div', {
    style: {
      border: `1px solid ${colorByName.elementMid}`,
      backgroundColor: colorByName.elementLightest,
      padding: '10px',
      position: 'relative',
      marginTop: '10px',
      marginBottom: '10px'
    },
    tabindex: '0',
    onKeyDown: ({ keyCode, metaKey, ctrlKey }) => {
      // ctrl + c or cmd + c
      if ((metaKey || ctrlKey) && keyCode === 67) {
        copy();
      }
    }
  }, children.concat(copyButton));

  function copy () {
    domCopy(text);
    onCopy(text);
    copied[id] = true;

    render();
    setTimeout(() => {
      copied[id] = false;
      render();
    }, 1000);
  }
}
