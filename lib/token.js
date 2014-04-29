var crypto = require('crypto');


exports.encrypt = function(data, pwd) {
  var cipher = crypto.createCipher('aes192', pwd);
  return cipher.update(JSON.stringify(data), 'utf8', 'base64') + cipher.final('base64');
};


exports.decrypt = function(data, pwd) {
  var decipher = crypto.createDecipher('aes192', pwd);
  try {
    return JSON.parse(decipher.update(data, 'base64', 'utf8') + decipher.final('utf8'));
  } catch (e) {}
};
