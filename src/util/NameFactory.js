'use strict';

var crypto = require('crypto');

module.exports = {
  generate: generate
};

function generate(data) {
  var sha1sum = crypto.createHash('sha1');
  sha1sum.update(data);
  var s = sha1sum.digest('hex');
  var i = -1;
  return 'xxxxxxxxxxxx'.replace(/[x]/g, function () {
    i += 1;
    return s[i];
  }).toUpperCase();
}
