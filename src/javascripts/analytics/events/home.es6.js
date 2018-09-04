import { track } from 'analytics/Analytics.es6';

export function selectedLanguage(language) {
  track('home:language_selected', {
    language: language
  });
}

export function linkOpened(language, url) {
  track('home:link_opened', {
    language: language,
    url: url
  });
}

export function commandCopied(language, text) {
  track('home:command_copied', {
    language: language,
    selectedText: text
  });
}
