import {h} from 'ui/Framework';
import $document from '$document';
import userAgent from 'userAgent';
import { byName as colorByName } from 'Styles/Colors';
import $timeout from '$timeout';
import { copyToClipboard as trackCopyToClipboard } from 'analytics/events/DocsSidebar';

const state = {};

export default function ({ children, text, id }, render) {
  const canCopy = !userAgent.isSafari();

  state[id] = state[id] || { copied: false };

  const copyButton = h(`button.docs-sidebar__copy-button.fa.${state[id].copied ? 'fa-check' : 'fa-copy'}`, {
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
    }
  }, children.concat(canCopy ? copyButton : []));

  function copy () {
    const doc = $document[0];
    const input = doc.createElement('input');

    input.value = text;
    input.type = 'text';
    doc.body.appendChild(input);
    input.select();
    doc.execCommand('copy', false);
    trackCopyToClipboard(id);
    state[id].copied = true;
    render();
    $timeout(() => {
      state[id].copied = false;
      render();
    }, 1000);
  }
}
