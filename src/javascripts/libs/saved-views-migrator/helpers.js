const _ = require('lodash');

const operatorDescriptions = {
  '<=': 'Less than or equal',
  '<': 'Less than',
  '>=': 'Greater than or equal',
  '>': 'Greater than',
  '=': 'Equal',
  '==': 'Equal',
  '!=': 'Not equal'
};

const dateOperatorDescriptions = {
  '<=': 'Before or on that date/time',
  '<': 'Before that date/time',
  '>=': 'After or on that date/time',
  '>': 'After that date/time',
  '==': 'Exactly on that date/time',
  '!=': 'Not on that date/time'
};

const RELATIVE_DATE_REGEX = /(\d+) +days +ago/i;

module.exports = {
  queryOperator,
  apiNameOrId,
  sizeParser,
  findField,
  makeListCompletion,
  makeOperatorList,
  makeDateOperatorList,
  makeDateCompletion,
  isRelativeDate,
  operatorDescription,
  dateOperatorDescription
};

// Convert operator into operator for the querystring
// CONVERT(datecompletions) + PAIRTOREQUESTOBJECT
function queryOperator(op) {
  return op === '<='
    ? '[lte]'
    : op === '<'
    ? '[lt]'
    : op === '>='
    ? '[gte]'
    : op === '>'
    ? '[gt]'
    : op === '!='
    ? '[ne]'
    : '';
}

function apiNameOrId(field) {
  if (field.apiName) {
    return field.apiName;
  } else {
    return field.id;
  }
}

function sizeParser(exp) {
  const number = parseInt(exp, 10);
  if (number < 1) return exp;

  if (exp.match(/kib/i)) {
    return number * 1024;
  } else if (exp.match(/kb?/i)) {
    return number * 1000;
  } else if (exp.match(/mib/i)) {
    return number * 1024 * 1024;
  } else if (exp.match(/mb?/i)) {
    return number * 1000 * 1000;
  } else {
    return exp;
  }
}

/**
 * Identifies a field by its ID, falling back to searching by name
 * COMPLETIONS + PAIRTOREQUESTOBJECT
 *
 * @param {string}  key
 * @param {contentType?}  Array<contentType>
 *
 * @returns {API.ContentType.Field?}
 */
function findField(key, contentType) {
  if (!contentType) {
    return;
  }

  const fields = contentType.fields;
  return _.find(fields, matchApiName) || _.find(fields, matchFieldLabel);

  function matchApiName(field) {
    return apiNameOrId(field) === key;
  }

  function matchFieldLabel(field) {
    return field.name.toLowerCase() === key.toLowerCase();
  }
}

// Helper for creating a listCompletion from values
//
// values can either be strings or {value, description} objects
function makeListCompletion(values) {
  return {
    type: 'List',
    items: _.map(values, val => (_.isPlainObject(val) ? val : { value: '"' + val + '"' }))
  };
}

// Helper for creating a list completion with operators
// with descriptions based on the type of the key
function makeOperatorList(operators) {
  return _.map(operators, op => ({
    value: op,
    description: operatorDescription(op)
  }));
}

function makeDateOperatorList() {
  const operators = ['==', '<', '<=', '>=', '>'];
  return _.map(operators, op => ({
    value: op,
    description: dateOperatorDescription(op)
  }));
}

function makeDateCompletion() {
  return {
    type: 'Date'
  };
}

function isRelativeDate(value) {
  return RELATIVE_DATE_REGEX.test(value);
}

function operatorDescription(op) {
  return operatorDescriptions[op] || '';
}

function dateOperatorDescription(op) {
  return dateOperatorDescriptions[op] || '';
}
