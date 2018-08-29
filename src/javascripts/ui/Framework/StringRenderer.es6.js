import { kebabCase, mapValues } from 'lodash';
import * as VTree from './VTree';
import { caseof } from 'sum-types';

/**
 * Render a virtual DOM tree into an HTML string.
 */
export default function vtreeToString(vtree) {
  return caseof(vtree, [
    [
      VTree.Element,
      ({ tag, props, children }) => {
        const htmlProps = mapValues(props, (value, key) => {
          if (key === 'style') {
            return renderStyles(value);
          } else {
            return value;
          }
        });

        const content = children
          .filter(v => v)
          .map(vtreeToString)
          .join('');
        return createHTMLString(tag, htmlProps, content);
      }
    ],
    [
      VTree.Text,
      ({ text }) => {
        return text;
      }
    ]
  ]);
}

function renderStyles(styles) {
  if (typeof styles === 'string') {
    return styles;
  } else {
    return Object.keys(styles)
      .map(prop => {
        return `${kebabCase(prop)}: ${styles[prop]}`;
      })
      .join(';');
  }
}

// Elements that have no content.
const VOID_ELEMENTS = [
  'area',
  'base',
  'br',
  'col',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'command',
  'keygen',
  'source'
];

/**
 * Takes a tag name, a string to string map of attributes, and a
 * content string to produce an HTML element.
 */
function createHTMLString(tag, attrs, content) {
  const isVoid = VOID_ELEMENTS.indexOf(tag) > -1;
  const closeTag = isVoid ? '' : `</${tag}>`;

  if (isVoid || !content) {
    content = '';
  }

  attrs = Object.keys(attrs)
    .map(attr => {
      const value = attrs[attr];
      if (value === true) {
        return attr;
      } else {
        const escapedValue = value.replace(/"/g, '&quot;');
        return `${attr}="${escapedValue}"`;
      }
    })
    .join(' ');

  attrs = attrs.length > 0 ? ` ${attrs}` : '';

  return `<${tag}${attrs}>${content}${closeTag}`;
}
