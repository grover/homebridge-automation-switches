'use strict';

var crypto = require('crypto');

module.exports = {
  generate: generate
};

function generate(prefix, name) {
  const sha1sum = crypto.createHash('sha1');
  sha1sum.update(prefix);
  sha1sum.update(name);

  const s = sha1sum.digest('hex');
  let i = -1;

  const serialNumber = 'xxxxxxxxxxxx'.replace(/[x]/g, () => s[++i]).toUpperCase();

  return [prefix, serialNumber].join('');
}
