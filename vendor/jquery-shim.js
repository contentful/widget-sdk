import $ from 'jquery';

if (typeof window !== 'undefined') {
  window.custom$ = window.$ = window.jQuery = $;
}
