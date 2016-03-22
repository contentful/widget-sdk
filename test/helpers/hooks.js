'use strict';

beforeEach(function () {
  this._angularElements = [];
});

afterEach(function () {
  this._angularElements.forEach(function (el) {
    el.remove();
  });
  delete this._angularElements;
});

