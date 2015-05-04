'use strict';

import hljs from 'highlight.js';

export default function highlight(code, lang) {
  if (!lang)
    return hljs.highlightAuto(code).value;
  else
    return hljs.highlight(lang, code).value;
}

