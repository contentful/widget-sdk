import {track} from 'analytics/Analytics';

export function spaceSelected (space) {
  track('home:space_selected', {
    targetSpaceId: space.getId(),
    targetSpaceName: space.getName()
  });
}

export function spaceLearnSelected (space) {
  track('home:space_learn_selected', {
    targetSpaceId: space.getId(),
    targetSpaceName: space.getName()
  });
}

export function selectedLanguage (language) {
  track('home:language_selected', {
    language: language
  });
}

export function linkOpened (language, url) {
  track('home:link_opened', {
    language: language,
    url: url
  });
}

export function commandCopied (language, text) {
  track('home:command_copied', {
    language: language,
    selectedText: text
  });
}
