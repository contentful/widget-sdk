/**
 * Given a string value this function copies it to the user’s clipboard
 */
export default function (value) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy', false);
  document.body.removeChild(input);
}
