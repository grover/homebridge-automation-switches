"use strict";

class FakeStorageWrapper {
  store(value, callback) {
    callback(undefined);
  }

  retrieve(defaultValue, callback) {
    callback(undefined, defaultValue);
  }
};

module.exports = FakeStorageWrapper;
