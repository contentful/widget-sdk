import analytics from 'analytics';

export function spaceSelected (space) {
  analytics.track('home:space_selected', {
    targetSpaceId: space.getId(),
    targetSpaceName: space.getName()
  });
}

export function spaceLearnSelected (space) {
  analytics.track('home:space_learn_selected', {
    targetSpaceId: space.getId(),
    targetSpaceName: space.getName()
  });
}

export function selectedLanguage (language) {
  analytics.track('home:language_selected', {
    language: language
  });
}

export function linkOpened (language, url) {
  analytics.track('home:link_opened', {
    language: language,
    url: url
  });
}

export function commandCopied (language, text) {
  analytics.track('home:command_copied', {
    language: language,
    selectedText: text
  });
}
