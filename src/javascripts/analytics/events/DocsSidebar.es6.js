import {track} from 'analytics/Analytics';

const eventName = 'docs_sidebar:action';

export function continueIntro () {
  track(eventName, {action: 'continue_intro'});
}

export function completeIntro () {
  track(eventName, {action: 'complete_intro'});
}

export function toggle ({isExpanded, isIntro}) {
  track(eventName, {isIntro, action: isExpanded ? 'expand' : 'minimize'});
}

export function toggleVisibility ({isHidden, isIntro}) {
  const action = isHidden ? 'hide' : 'show';
  track(eventName, {isIntro, action});
}

export function dismissCallout () {
  track(eventName, {action: 'dismiss_callout'});
}

export function navigateWhileOpen ({isIntro}) {
  track(eventName, {action: 'navigate_while_open', isIntro});
}

export function clickLink (url) {
  track(eventName, {action: 'click_link', url});
}

export function copyToClipboard (contentCopied) {
  track(eventName, {action: 'copy_to_clipboard', contentCopied});
}
