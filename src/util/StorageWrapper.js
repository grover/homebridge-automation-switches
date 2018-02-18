'use strict';

const Storage = require('node-persist').create();
const NameFactory = require('./NameFactory');

class StorageWrapper {
  constructor(api, log, type, name) {
    this._key = `${type}.${NameFactory.generate(name)}.json`;
    log(`Switch ${name} is stored in file ${this._key}`);

    Storage.initSync({ dir: api.user.persistPath() });
  }

  store(value, callback) {
    Storage.setItem(this._key, value, (error) => {
      if (error) {
        callback(error);
        return;
      }

      Storage.persistKey(this._key, (error) => {
        callback(error);
      });
    });
  }

  retrieve(defaultValue, callback) {
    Storage.getItem(this._key, (error, data) => {
      if (error) {
        callback(error, defaultValue);
        return;
      }

      if (data === undefined) {
        data = defaultValue;
      }

      callback(undefined, data);
    });
  }
}

module.exports = StorageWrapper;
