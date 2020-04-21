/*

  A reference to the browser's window object.
  While window is globally available in JavaScript, it causes testability problems,
  because it is a global variable.
  This services helps us to mock window object without using global.window.
*/

export const window = global.window;
