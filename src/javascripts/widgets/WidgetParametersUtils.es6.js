import { clone } from 'lodash';

// Built-in date picker conditionally renderes one of its parameters.
// We could buit a generic dependency mechanism but for now we just
// filter manually the only known scenario.
export function filterDefinitions(definitions, values, combinedWidgetId) {
  if (combinedWidgetId === 'builtin,datePicker') {
    return definitions.filter(definition => {
      // Always display all parameters but `ampm`. Show `ampm` only
      // if `format` includes time.
      return definition.id !== 'ampm' || ['time', 'timeZ'].includes(values.format);
    });
  } else {
    return [].concat(definitions);
  }
}

// When persisting parameter values we only want to use values
// of parameters that are defined in the widget descriptor.
// `undefined` values are skipped.
export function filterValues(definitions, values) {
  return definitions.reduce((acc, { id }) => {
    if (typeof values[id] !== 'undefined') {
      return { ...acc, [id]: values[id] };
    } else {
      return acc;
    }
  }, {});
}

export function markMissingValues(definitions, values) {
  return definitions.reduce((acc, { id, required }) => {
    if (required && typeof values[id] === 'undefined') {
      return { ...acc, [id]: true };
    } else {
      return acc;
    }
  }, {});
}

export function applyDefaultValues(definitions, values = {}) {
  return definitions.reduce((acc, definition) => {
    const { id, default: defaultValue } = definition;
    if (id in values) {
      return acc;
    } else {
      const hasDefault = typeof defaultValue !== 'undefined';
      return Object.assign(acc, hasDefault ? { [id]: defaultValue } : {});
    }
  }, clone(values));
}

// When specifying options for Enum parameters shortcut syntax can be used:
// `['option 1', 'option 2']`. Here we convert it to the labelled syntax:
// `{'option 1': 'option 1', 'option 2': 'option 2'}` expected by the form.
export function unifyEnumOptions(definitions) {
  return definitions.map(definition => {
    if (definition.type === 'Enum' && typeof definition.options[0] === 'string') {
      return {
        ...definition,
        options: definition.options.reduce((acc, opt) => acc.concat([{ [opt]: opt }]), [])
      };
    } else {
      return definition;
    }
  });
}
