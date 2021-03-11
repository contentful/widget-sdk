export const RELATIVE_DATE_REGEX = /(\d+) +days +ago/i;

const OP_MAP = {
  '<=': '[lte]',
  '<': '[lt]',
  '>=': '[gte]',
  '>': '[gt]',
  '!=': '[ne]',
};

export const queryOperator = (op) => OP_MAP[op] || '';
