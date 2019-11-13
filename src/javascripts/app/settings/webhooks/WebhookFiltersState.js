export const CONSTRAINT_NAMES = {
  EQUALS: 'equals',
  IN: 'in',
  REGEXP: 'regexp'
};

export const PATH_VALUES = {
  ENVIRONMENT: 'sys.environment.sys.id',
  CONTENT_TYPE: 'sys.contentType.sys.id',
  ENTITY: 'sys.id'
};

export const CONSTRAINT_TYPES = [
  { name: CONSTRAINT_NAMES.EQUALS },
  { name: CONSTRAINT_NAMES.EQUALS, negated: true },
  { name: CONSTRAINT_NAMES.IN },
  { name: CONSTRAINT_NAMES.IN, negated: true },
  { name: CONSTRAINT_NAMES.REGEXP },
  { name: CONSTRAINT_NAMES.REGEXP, negated: true }
];

export const PATHS = [PATH_VALUES.ENVIRONMENT, PATH_VALUES.CONTENT_TYPE, PATH_VALUES.ENTITY];

export const DEFAULT_FILTER = {
  constraint: 0,
  path: PATH_VALUES.ENVIRONMENT,
  value: 'master'
};

export function matchConstraintType(constraint) {
  let name = Object.keys(constraint)[0];
  let negated = false;

  if (name === 'not') {
    negated = true;
    name = Object.keys(constraint[name])[0];
  }

  return CONSTRAINT_TYPES.findIndex(
    constraint => constraint.name === name && !!constraint.negated === negated
  );
}

export function normalizeValue(constraint, value) {
  if (constraint.name === CONSTRAINT_NAMES.IN) {
    const values = value.split(',').map(val => val.trim());
    return values.filter((val, i) => i === values.length - 1 || val.length > 0);
  }

  if (constraint.name === CONSTRAINT_NAMES.REGEXP) {
    return { pattern: value };
  }

  return value;
}

export function denormalizeValue(constraint, value) {
  if (constraint.name === CONSTRAINT_NAMES.IN && Array.isArray(value)) {
    return value.join(',');
  }

  if (constraint.name === CONSTRAINT_NAMES.REGEXP && typeof value.pattern === 'string') {
    return value.pattern;
  }

  return typeof value === 'string' ? value : '';
}

export function transformFiltersToList(filters) {
  if (!Array.isArray(filters)) return [DEFAULT_FILTER];

  return filters.map(filter => {
    const constraintIndex = matchConstraintType(filter);
    const constraint = CONSTRAINT_TYPES[constraintIndex];

    const content = constraint.negated ? filter.not[constraint.name] : filter[constraint.name];
    const path = content[0].doc;
    const value = denormalizeValue(constraint, content[1]);

    return {
      constraint: constraintIndex,
      path,
      value
    };
  });
}

export function transformListToFilters(list) {
  return list.map(row => {
    const constraint = CONSTRAINT_TYPES[row.constraint];
    const filter = {
      [constraint.name]: [{ doc: row.path }, normalizeValue(constraint, row.value)]
    };

    if (constraint.negated) {
      return { not: filter };
    }

    return filter;
  });
}
