/* global document, window */
const GHOST_ELEMENT_ID = '__autosizeInputGhost';

const STYLE_KEYS = [
  'box-sizing',
  'border-left',
  'border-right',
  'font-family',
  'font-feature-settings',
  'font-kerning',
  'font-size',
  'font-stretch',
  'font-style',
  'font-variant',
  'font-variant-caps',
  'font-variant-ligatures',
  'font-variant-numeric',
  'font-weight',
  'letter-spacing',
  'padding-left',
  'padding-right',
  'text-indent',
  'text-transform'
];

function copyStyles (src, target) {
  const srcStyle = window.getComputedStyle(src);
  STYLE_KEYS.forEach((key) => {
    target.style[key] = srcStyle[key];
  });
}

function getGhost () {
  let ghost = document.getElementById(GHOST_ELEMENT_ID);
  if (!ghost) {
    ghost = document.createElement('div');
    ghost.id = GHOST_ELEMENT_ID;
    ghost.style.whiteSpace = 'pre';
    ghost.style.display = 'inline-block';
    ghost.style.height = '0';
    ghost.style.overflow = 'hidden';
    ghost.style.position = 'absolute';
    ghost.style.top = '0';
    ghost.style.visibility = 'hidden';
    document.body.appendChild(ghost);
  }
  return ghost;
}

export function autosizeInput (element) {
  const ghost = getGhost();
  if (!element) {
    ghost.remove();
    return;
  }

  function update () {
    const str = element.value || element.getAttribute('placeholder') || '';
    copyStyles(element, ghost);
    ghost.textContent = str;

    const width = window.getComputedStyle(ghost).width;
    element.style.width = width;
  }

  element.addEventListener('input', update);
  update();
}
