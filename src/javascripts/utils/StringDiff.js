export function diff(a, b) {
  if (a === b) {
    return [];
  }

  let commonStart = 0;
  let commonEnd = 0;

  // Determine the size of the common prefix.
  while (a.charAt(commonStart) === b.charAt(commonStart)) {
    commonStart += 1;
  }

  // Determine the size of the common suffix.
  // We break before we overlap with the common prefix
  while (
    charFromEnd(a, commonEnd) === charFromEnd(b, commonEnd) &&
    commonStart + commonEnd < a.length &&
    commonStart + commonEnd < b.length
  ) {
    commonEnd += 1;
  }

  const ops = [];

  const deletedChars = a.length - commonStart - commonEnd;
  if (deletedChars > 0) {
    ops.push({ delete: [commonStart, deletedChars] });
  }
  const insertedChars = b.length - commonStart - commonEnd;
  if (insertedChars > 0) {
    ops.push({ insert: [commonStart, b.slice(commonStart, b.length - commonEnd)] });
  }

  return ops;
}

function charFromEnd(str, i) {
  return str.charAt(str.length - 1 - i);
}
