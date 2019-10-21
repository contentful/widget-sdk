import { track } from 'analytics/Analytics.es6';

export function selectedLanguage(language) {
  track('home:language_selected', {
    language
  });
}

export function linkOpened(language, url) {
  track('home:link_opened', {
    language,
    url
  });
}

export function commandCopied(language, text) {
  track('home:command_copied', {
    language,
    selectedText: text
  });
}
