import $timeout from '$timeout';
import LazyLoader from 'LazyLoader';
import * as treeBuilder from 'markdown_editor/markdown_tree';

const NOTIFY_INTERVAL = 250;
const UNIQUE_SOMETHING = {};

export function start (getContentFn, subscriberCb) {
  let destroyed = false;
  let previousValue = UNIQUE_SOMETHING;
  let buildTree;

  LazyLoader.get('markdown').then(function (libs) {
    buildTree = treeBuilder.create(libs);
    scheduleSubscriberNotification();
  });

  return function stopNotification () {
    destroyed = true;
  };

  function scheduleSubscriberNotification () {
    $timeout(notifySubscriber, NOTIFY_INTERVAL);
  }

  function notifySubscriber () {
    // editor was destroyed - kill loop immediately
    if (destroyed) { return; }

    // check if something changed
    let value = getContentFn();
    if (value === previousValue) {
      scheduleSubscriberNotification();
      return;
    }

    value = value || '';
    previousValue = value;

    // build tree
    let tree = {};
    let err = null;
    try {
      tree = buildTree(value);
    } catch (e) {
      // it can go wrong: Marked throws an error when
      // input cannot be parsed
      err = e;
    }

    // notify subscriber
    const info = { chars: value.length, words: tree.words };
    subscriberCb(err, { tree: tree.root, info: info });

    // repeat
    scheduleSubscriberNotification();
  }
}
