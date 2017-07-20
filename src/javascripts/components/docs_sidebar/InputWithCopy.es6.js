import {h} from 'ui/Framework';
import $ from 'jquery';
import $document from '$document';
import userAgent from 'userAgent';
import $timeout from '$timeout';

const state = {};

export default function render (id, value, rerender) {

  const canCopy = !userAgent.isSafari();

  state[id] = state[id] || {copying: false};

  const input = h('input.cfnext-form__input--full-size', {
    value,
    type: 'text',
    readonly: true,
    ariaLabel: id,
    onClick: selectAllInput,
    style: {cursor: 'pointer'}
  });

  const copyBtn = h('button', {
    class: [
      'cfnext-form__icon-suffix',
      'copy-to-clipboard', 'x--input-suffix',
      'fa', state[id].copying ? 'fa-check' : 'fa-copy'
    ].join(' '),
    onClick: () => copy(id, value)
  }, [tooltip()]);


  return h('.cfnext-form__input-group--full-size', {},
    canCopy ? [input, copyBtn] : [input]
  );

  function copy (id, value) {
    copyToClipboard(value);
    state[id].copying = true;
    rerender();
    $timeout(function () {
      state[id].copying = false;
      rerender();
    }, 1500);
  }
}

function tooltip () {
  return h('.copy-tooltip.tooltip.top', [
    h('.tooltip-inner', ['Copy to clipboard']),
    h('span', {class: 'tooltip-arrow'})
  ]);
}

function selectAllInput (evt) {
  const $el = $(evt.target);
  const end = $el.val().length;
  $el.textrange('set', 0, end);
}

function copyToClipboard (text) {
  const doc = $document[0];
  const input = doc.createElement('input');
  input.value = text;
  input.type = 'text';
  doc.body.appendChild(input);
  input.select();
  doc.execCommand('copy', false, null);
  input.remove();
}
