const _ = require('lodash');
const moment = require('moment');
const helpers = require('./helpers');

module.exports = function(getAllUsers) {
  return {
    updatedAt: dateCompletions('sys.updatedAt', 'Date the item was modified'),
    createdAt: dateCompletions('sys.createdAt', 'Date the item was created'),
    publishedAt: dateCompletions('sys.publishedAt', 'Date the item was last published'),
    firstPublishedAt: dateCompletions(
      'sys.firstPublishedAt',
      'Date the item was published for the first time'
    ),
    id: {
      description: 'Unique identifier',
      convert: function(_operator, value) {
        return { 'sys.id': value };
      }
    },
    author: createUserAutocompletion(getAllUsers, {
      path: 'sys.createdBy.sys.id',
      description: 'User who created the item'
    }),
    updater: createUserAutocompletion(getAllUsers, {
      path: 'sys.updatedBy.sys.id',
      description: 'User who updated the item most recently'
    }),
    status: {
      description: 'Current status of the item',
      complete: helpers.makeListCompletion(getAllUsers, [
        {
          value: 'published',
          description: 'Published and visible to the public'
        },
        {
          value: 'changed',
          description: 'Was modified, but changes are invisible until re-published'
        },
        { value: 'draft', description: 'Not published, invisible to the public' },
        {
          value: 'archived',
          description: 'Not published and hidden from editors'
        }
      ]),
      convert: function(_operator, value) {
        if (value === 'published') {
          return {
            'sys.publishedAt[exists]': 'true'
          };
        }

        if (value === 'changed') {
          return {
            'sys.archivedAt[exists]': 'false',
            changed: 'true'
          };
        }

        if (value === 'draft') {
          return {
            'sys.archivedAt[exists]': 'false',
            'sys.publishedVersion[exists]': 'false',
            changed: 'true'
          };
        }

        if (value === 'archived') {
          return {
            'sys.archivedAt[exists]': 'true'
          };
        }

        return {};
      }
    }
  };
};

// Generates a factory for completing a key that contains a date
function dateCompletions(key, description) {
  const DAY = /^\s*\d{2,4}-\d{2}-\d{2}\s*$/;
  const EQUALITY = /^(==|=|:)$/;
  return {
    description: description,
    operators: helpers.makeDateOperatorList(),
    complete: helpers.makeDateCompletion(),
    convert: function(op, exp) {
      try {
        const match = helpers.RELATIVE_DATE_REGEX.exec(exp);
        const date = match ? moment().subtract(match[1], 'days') : moment(exp);
        if (date.isValid()) {
          const query = {};
          if (dayEquality(op, exp)) {
            query[key + helpers.queryOperator('>=')] = date.startOf('day').toISOString();
            query[key + helpers.queryOperator('<=')] = date.endOf('day').toISOString();
          } else {
            query[key + helpers.queryOperator(op)] = date.toISOString();
          }
          return query;
        }
      } catch (e) {
        return;
      }
    }
  };

  function dayEquality(op, exp) {
    return EQUALITY.test(op) && DAY.test(exp);
  }
}

function createUserAutocompletion(getAllUsers, opts) {
  return {
    description: opts.description,
    complete: function() {
      return getUserMap(getAllUsers).then(userMap => {
        const values = Object.keys(userMap).map(name => ({
          value: '"' + name + '"',
          description: name
        }));
        return helpers.makeListCompletion(values);
      });
    },
    convert: function(_op, value) {
      return getUserMap(getAllUsers).then(userMap => {
        if (userMap[value]) {
          const query = {};
          query[opts.path] = userMap[value];
          return query;
        }
      });
    }
  };
}

// A map from usernames to the user IDs:
// - by default user names are just "First Last"
// - duplicates are differentiated with ID: "First Last (someid123)"
function getUserMap(getAllUsers) {
  return getAllUsers().then(users => {
    const transformed = users.map(user => ({
      id: user.sys.id,

      // remove double quotes from the name
      // this way user names don't break search box syntax
      name: (user.firstName + ' ' + user.lastName).replace('"', '')
    }));

    const counts = _.countBy(transformed, 'name');

    return transformed.reduce((acc, u) => {
      const key = counts[u.name] > 1 ? u.name + ' (' + u.id + ')' : u.name;
      acc[key] = u.id;
      return acc;
    }, {});
  });
}
