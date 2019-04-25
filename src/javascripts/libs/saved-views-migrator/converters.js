const moment = require('moment');
const { queryOperator, RELATIVE_DATE_REGEX } = require('./helpers');

const DAY = /^\s*\d{2,4}-\d{2}-\d{2}\s*$/;
const EQUALITY = /^(==|=|:)$/;
const dayEquality = (op, val) => EQUALITY.test(op) && DAY.test(val);

const sharedConverters = {
  id: (_op, val) => ({ 'sys.id': val }),
  status: statusConverter,
  updatedAt: dateConverterFor('sys.updatedAt'),
  createdAt: dateConverterFor('sys.createdAt'),
  publishedAt: dateConverterFor('sys.publishedAt'),
  firstPublishedAt: dateConverterFor('sys.firstPublishedAt')
};

const assetSpecificConverters = {
  filename: (_op, val) => ({ 'fields.file.fileName': val }),
  type: (_op, val) => ({ mimetype_group: val }),
  width: (op, val) => ({ [`fields.file.details.image.width${queryOperator(op)}`]: val }),
  height: (op, val) => ({ [`fields.file.details.image.height${queryOperator(op)}`]: val }),
  size: (op, val) => ({ [`fields.file.details.size${queryOperator(op)}`]: sizeParser(val) })
};

module.exports = {
  Entry: { ...sharedConverters },
  Asset: { ...sharedConverters, ...assetSpecificConverters }
};

function statusConverter(_op, val) {
  if (val === 'published') {
    return { 'sys.publishedAt[exists]': 'true' };
  }

  if (val === 'changed') {
    return {
      'sys.archivedAt[exists]': 'false',
      changed: 'true'
    };
  }

  if (val === 'draft') {
    return {
      'sys.archivedAt[exists]': 'false',
      'sys.publishedVersion[exists]': 'false',
      changed: 'true'
    };
  }

  if (val === 'archived') {
    return { 'sys.archivedAt[exists]': 'true' };
  }
}

function dateConverterFor(key) {
  return (op, val) => {
    const match = RELATIVE_DATE_REGEX.exec(val);
    const date = match ? moment().subtract(match[1], 'days') : moment(val);

    if (date.isValid()) {
      if (dayEquality(op, val)) {
        return {
          [`${key}${queryOperator('>=')}`]: date.startOf('day').toISOString(),
          [`${key}${queryOperator('<=')}`]: date.endOf('day').toISOString()
        };
      } else {
        return { [`${key}${queryOperator(op)}`]: date.toISOString() };
      }
    }
  };
}

function sizeParser(value) {
  const number = parseInt(value, 10);

  if (number < 1) {
    return value;
  } else if (value.match(/kib/i)) {
    return number * 1024;
  } else if (value.match(/kb?/i)) {
    return number * 1000;
  } else if (value.match(/mib/i)) {
    return number * 1024 * 1024;
  } else if (value.match(/mb?/i)) {
    return number * 1000 * 1000;
  } else {
    return value;
  }
}
