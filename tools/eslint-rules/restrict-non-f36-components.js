const blacklist = {
  button: '<Button />',
  a: '<TextLink />',
  ul: '<List />',
  select: '<Select />',
  textarea: '<Textarea />',
  input_checkbox: '<Checkbox />',
  input_text: '<TextInput />',
  input_number: '<TextInput />',
  input_radio: '<RadioButton />',
  p: '<Paragraph />',
  h1: '<Heading />, <SubHeading />, <SectionHeading /> or <DisplayText />',
  h2: '<Heading />, <SubHeading />, <SectionHeading /> or <DisplayText />',
  h3: '<Heading />, <SubHeading />, <SectionHeading /> or <DisplayText />',
  h4: '<Heading />, <SubHeading />, <SectionHeading /> or <DisplayText />',
  h5: '<Heading />, <SubHeading />, <SectionHeading /> or <DisplayText />',
  h6: '<Heading />, <SubHeading />, <SectionHeading /> or <DisplayText />',
};

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow non Forma 36 components',
      category: 'Best Practices',
    },
    messages: {
      useForma36: "Please consider using the corresponding Forma 36 '{{ name }}' component.",
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const nodeName = node.name && node.name.name;
        const typeAttributes = node.attributes
          .filter((att) => att && att.name && att.name.name === 'type')
          .reduce((_, prev) => prev, undefined);
        const typeValue = typeAttributes ? `_${typeAttributes.value.value}` : '';
        const blackListKey = `${nodeName}${typeValue}`;

        if (blacklist[blackListKey]) {
          context.report({
            node,
            messageId: 'useForma36',
            data: {
              name: blacklist[blackListKey],
            },
          });
        }
      },
    };
  },
};
