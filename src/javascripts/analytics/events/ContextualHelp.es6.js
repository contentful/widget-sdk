import {track as _track} from 'analytics/Analytics';

const track = data => _track('contextual_help:action', data);

export function continueIntro () {
  track({action: 'continue_intro'});
}

export function completeIntro () {
  track({action: 'complete_intro'});
}

export function toggle (isExpanded, isIntro) {
  track({isIntro, action: isExpanded ? 'expand' : 'minimize'});
}

export function toggleVisibility (isHidden, isIntro) {
  track({isIntro, action: isHidden ? 'hide' : 'show'});
}

export function dismissCallout () {
  track({action: 'dismiss_callout'});
}

export function navigateWhileOpen (isIntro) {
  track({action: 'navigate_while_open', isIntro});
}

export function clickLink (url) {
  track({action: 'click_link', url});
}

export function copyToClipboard (contentCopiedId) {
  track({action: 'copy_to_clipboard', contentCopiedId});
}
