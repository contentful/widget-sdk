'use strict';

import hljs from 'highlight.js';

export default function highlight (code, lang) {
  if (hasLanguage(lang))
    return hljs.highlight(lang, code).value;
  else
    return hljs.highlightAuto(code).value;
}

function hasLanguage (lang) {
  return !!hljs.getLanguage(lang);
}
