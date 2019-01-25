// Utilities for creating and handling Content Type fields.
// Used in the Content Type editor.

/**
 * List of descriptors for all available fields types.
 *
 * If the `label` and `icon` properties of a descriptor are not set,
 * they will be auto-generated.
 */
export const FIELD_TYPES = [
  {
    name: 'Symbol',
    hasListVariant: true,
    label: 'Short text',
    listLabel: 'Short text, list'
  },
  {
    name: 'Text',
    label: 'Long text'
  },
  {
    name: 'RichText',
    label: 'Rich text',
    icon: 'longtext'
  },
  {
    name: 'StructuredText',
    label: 'Structured text',
    icon: 'longtext'
  },
  {
    name: 'Integer',
    icon: 'number'
  },
  {
    name: 'Number',
    label: 'Decimal number',
    icon: 'decimal'
  },
  {
    name: 'Date',
    label: 'Date & time',
    icon: 'calendar'
  },
  {
    name: 'Location'
  },
  {
    name: 'Asset',
    isLink: true,
    hasListVariant: true,
    label: 'Media',
    listLabel: 'Media, many files'
  },
  {
    name: 'Boolean'
  },
  {
    name: 'Object',
    label: 'JSON object',
    icon: 'json'
  },
  {
    name: 'Entry',
    isLink: true,
    hasListVariant: true,
    label: 'Reference',
    listLabel: 'References, many'
  }
].map(fieldType => {
  const label = fieldType.label || fieldType.name;
  const icon = label.replace(/\s/g, '').toLowerCase();
  return { label, icon, ...fieldType };
});

export const groups = [
  {
    name: 'rich-text',
    icon: 'richtext',
    label: 'Rich text',
    isBeta: true,
    description: 'Text formatting with references and media',
    types: ['RichText'],
    modernBrowsersOnly: true
  },
  {
    name: 'text',
    icon: 'longtext',
    label: 'Text',
    description: 'Titles, names, paragraphs, list of names',
    types: ['Symbol', 'Text']
  },
  {
    name: 'number',
    label: 'Number',
    description: 'ID, order number, rating, quantity',
    types: ['Integer', 'Number']
  },
  {
    name: 'date-time',
    icon: 'calendar',
    label: 'Date and time',
    description: 'Event date, opening hours',
    types: ['Date']
  },
  {
    name: 'location',
    label: 'Location',
    description: 'Coordinates: latitude and longitude',
    types: ['Location']
  },
  {
    name: 'media',
    label: 'Media',
    description: 'Images, videos, PDFs and other files',
    types: ['Asset']
  },
  {
    name: 'boolean',
    label: 'Boolean',
    description: 'Yes or no, 1 or 0, true or false',
    types: ['Boolean']
  },
  {
    name: 'json',
    label: 'JSON object',
    description: 'Data in JSON format',
    types: ['Object']
  },
  {
    name: 'reference',
    label: 'Reference',
    description: 'For example, a blog post can reference its author(s)',
    types: ['Entry']
  }
].map(group => {
  const types = group.types.map(getTypeByName);
  const icon = types[0].icon;
  return { icon, ...group, types };
});

function getTypeByName(name) {
  const type = FIELD_TYPES.find(field => field.name === name);

  if (type) {
    return type;
  } else {
    throw new Error(`Could not find field type "${name}"`);
  }
}

// Return a human readable label of a Content Type Field.
export function getLabel(field) {
  const descriptor = getFieldDescriptor(field);
  return descriptor.isList ? descriptor.listLabel : descriptor.label;
}

// Return an ID for the associated field icon.
export function getIconId(field) {
  return `field-${getFieldDescriptor(field).icon}`;
}

// Create an object that can extend a `Field` with type information.
export function createTypeInfo(descriptor, isList) {
  const type = descriptor.name;
  let info = { type };
  if (descriptor.isLink) {
    info.type = 'Link';
    info.linkType = type;
  }
  if (isList && descriptor.hasListVariant) {
    info = { type: 'Array', items: info };
  }
  return info;
}

function getFieldDescriptor(field) {
  let { type, linkType } = field;
  const isList = type === 'Array';

  if (isList) {
    type = field.items.type;
    linkType = field.items.linkType;
  }
  if (type === 'Link') {
    type = linkType;
  }
  const descriptor = FIELD_TYPES.find(field => field.name === type);
  if (!descriptor) {
    throw new Error(`Unknown field type "${type}"`);
  }
  return { isList, ...descriptor };
}
