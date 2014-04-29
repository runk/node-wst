var assert = require('assert'),
  fs = require('fs'),
  index = require('../'),
  storage = require('../lib/storage');


describe('index', function() {

  var next = function(err) {
    if (err) throw err;
  };

  var listeners, req, res;

  beforeEach(function() {
    listeners = {};
    req = {
      on: function(what, cb) { listeners[what] = cb },
      once: function(what, cb) { listeners[what] = cb },
      removeListener: function() {}
    };
    res = {
      set: function(k, v) {}
    };
  });

  it('should authenticate', function(done) {
    res.send = function(data) {
      assert.equal(Object.keys(storage.data).length, 1);
      done();
    };
    var mw = index({
      authorize: function(credentials, cb) {
        assert.deepEqual(credentials, {username: 'jdoe', password: 'pwd'});
        cb(null, true);
      }
    });

    mw(req, res, next);
    listeners.data(fs.readFileSync(__dirname + '/request.xml', 'utf8'));
    listeners.end();
  });

  it('should return 403 code with auth error', function(done) {
    res.send = function(code) {
      assert.equal(code, 403);
      done();
    };

    var mw = index({
      authorize: function(credentials, cb) {
        assert.deepEqual(credentials, {username: 'jdoe', password: 'pwd'});
        cb(null, false);
      }
    });

    mw(req, res);
    listeners.data(fs.readFileSync(__dirname + '/request.xml', 'utf8'));
    listeners.end();
  });

  it('should error for bad request', function(done) {
    var mw = index({authorize: function(credentials, cb) {}});

    mw(req, {}, function(err) {
      assert.equal(err.message, 'Non-whitespace before first tag.\nLine: 0\nColumn: 1\nChar: b');
      done();
    });
    listeners.data('blah');
    listeners.end();
  });

  it('should error for bad xml', function(done) {
    var mw = index({authorize: function(credentials, cb) {}});

    mw(req, {}, function(err) {
      assert.equal(err.message, 'Cannot find or parse UsernameToken entity');
      done();
    });
    listeners.data('<S:Envelope></S:Envelope>');
    listeners.end();
  });

});
