const _ = require('lodash');
const { diffArrays } = require('diff');

const pathMessage = (path, m) => `\`${path}\`\n\n${m}`;

module.exports = (diff) => {
  const { added, deleted, updated } = diff;
  if (added.length === 0 && deleted.length === 0 && updated.length === 0) {
    return 'No migration impact 😢';
  }

  const finalMessage = [];
  const suggestions = [];
  const praise = [];

  if (added.length > 0) {
    added.forEach(({ path, right }) => {
      if (right.karma) {
        suggestions.push(pathMessage(path, "Don't write new Karma tests."));
      }
      if (right.jade) {
        suggestions.push(pathMessage(path, "Don't create new `.jade` files."));
      }
      if (right.js && (right.angular || right.needsRefactoring)) {
        const deps = _.uniq([...(right.angular || []), ...(right.needsRefactoring || [])]);
        suggestions.push(
          pathMessage(
            path,
            `Avoid using the following dependencies:\n${deps
              .map((item) => `* \`${item}\``)
              .join('\n')}`
          )
        );
      }
    });
  }
  if (updated.length > 0) {
    updated.forEach((item) => {
      const rightDeps = _.uniq([
        ...(_.isArray(_.get(item, 'right.angular')) ? _.get(item, 'right.angular') : []),
        ...(_.isArray(_.get(item, 'right.needsRefactoring'))
          ? _.get(item, 'right.needsRefactoring')
          : []),
      ]).sort();
      const leftDeps = _.uniq([
        ...(_.isArray(item, 'left.angular') ? _.get(item, 'left.angular') : []),
        ...(_.isArray(item, 'left.needsRefactoring') ? _.get(item, 'left.needsRefactoring') : []),
      ]).sort();

      const diffResult = diffArrays(leftDeps, rightDeps);
      const addedResult = diffResult.find((item) => item.added === true);
      const removedResult = diffResult.find((item) => item.removed === true);
      if (addedResult) {
        suggestions.push(
          pathMessage(
            item.path,
            `Avoid using the following dependencies:\n${addedResult.value
              .map((item) => `* \`${item}\``)
              .join('\n')}`
          )
        );
      }
      if (removedResult) {
        praise.push(
          pathMessage(
            item.path,
            `🎖 for removing some 🤕 dependencies:\n${removedResult.value
              .map((item) => `* \`${item}\``)
              .join('\n')}`
          )
        );
      }
    });
  }

  if (deleted.length > 0) {
    deleted.forEach(({ path, left }) => {
      if (left.karma) {
        praise.push(pathMessage(path, '💯 points to your karma for removing Karma!'));
      }
      if (left.jade) {
        praise.push(pathMessage(path, 'Thanks for removing `.jade` 💯 points to Griffindor!'));
      }
      if (left.js && (left.angular || left.needsRefactoring)) {
        const deps = _.uniq([...(left.angular || []), ...(left.needsRefactoring || [])]);
        praise.push(
          pathMessage(
            path,
            `Take a 🍩 from the shelf for removing some 💩 dependencies:\n${deps
              .map((item) => `* \`${item}\``)
              .join('\n')}`
          )
        );
      }
    });
  }

  if (praise.length > 0) {
    finalMessage.push(`### Well done\n\n${praise.join('\n\n')}`);
  }

  if (suggestions.length > 0) {
    finalMessage.push(`### Could be better\n\n${suggestions.join('\n\n')}`);
  }

  if (finalMessage.length > 0) {
    return `<details><summary>More details</summary>\n\n${finalMessage.join('\n\n')}\n\n</details>`;
  }

  return '';
};
