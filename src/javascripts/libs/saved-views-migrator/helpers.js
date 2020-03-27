const RELATIVE_DATE_REGEX = /(\d+) +days +ago/i;

const OP_MAP = {
  '<=': '[lte]',
  '<': '[lt]',
  '>=': '[gte]',
  '>': '[gt]',
  '!=': '[ne]',
};

module.exports = {
  RELATIVE_DATE_REGEX,
  queryOperator: (op) => OP_MAP[op] || '',
};
