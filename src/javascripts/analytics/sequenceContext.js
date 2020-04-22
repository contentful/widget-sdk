import _ from 'lodash';

let sequenceContext = {};

export function addToSequenceContext(context) {
  sequenceContext = { ...sequenceContext, ...context };
}

export function initSequenceContext(context) {
  clearSequenceContext();
  addToSequenceContext(context);
}

export function clearSequenceContext() {
  sequenceContext = {};
}

export function getSequenceContext() {
  return _.cloneDeep(sequenceContext);
}

export function withSequenceContext(data) {
  return { ...getSequenceContext(), ...data };
}
