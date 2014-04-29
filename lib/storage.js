
exports.data = {};


exports.get = function(token, cb) {
  cb(null, exports.data[token]);
};


exports.set = function(token, meta, cb) {
  exports.data[token] = meta;
  cb();
};


exports.delete = function(token, cb) {
  delete exports.data[token];
  cb();
};
