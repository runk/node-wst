var assert = require('assert'),
  fs = require('fs'),
  index = require('../'),
  token = require('../lib/token');


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
      removeListener: function() {},
      headers: {}
    };
    res = {
      set: function(k, v) {}
    };
  });


  describe('auth()', function() {
    it('should authenticate', function(done) {
      res.send = function(data) {
        assert(data);
        done();
      };
      var mw = index.auth({
        secret: 'pwd!',
        authorize: function(credentials, cb) {
          assert.deepEqual(credentials, {username: 'jdoe', password: 'pwd'});
          cb(null, {id: 123});
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

      var mw = index.auth({
        secret: 'pwd!',
        authorize: function(credentials, cb) {
          assert.deepEqual(credentials, {username: 'jdoe', password: 'pwd'});
          cb(null, null);
        }
      });

      mw(req, res);
      listeners.data(fs.readFileSync(__dirname + '/request.xml', 'utf8'));
      listeners.end();
    });

    it('should error for bad request', function(done) {
      var mw = index.auth({secret: 'pwd!', authorize: function(credentials, cb) {}});

      mw(req, {}, function(err) {
        assert.equal(err.message, 'Non-whitespace before first tag.\nLine: 0\nColumn: 1\nChar: b');
        done();
      });
      listeners.data('blah');
      listeners.end();
    });

    it('should error for bad xml', function(done) {
      var mw = index.auth({secret: 'pwd!', authorize: function(credentials, cb) {}});

      mw(req, {}, function(err) {
        assert.equal(err.message, 'Cannot find or parse UsernameToken entity');
        done();
      });
      listeners.data('<S:Envelope></S:Envelope>');
      listeners.end();
    });
  });


  describe('check()', function() {
    it('should allow with valid key', function(done) {
      var expiry = Date.now() + 60000;
      var session = {id: 1, expiry: expiry};
      var secret = 's3cr3t';

      req.headers['x-securitytoken'] = token.encrypt(session, secret);
      var mw = index.check({secret: secret});
      mw(req, res, function(err) {
        if (err) return done(err);
        assert.deepEqual(req.session, session);
        done();
      });
    });

    it('should deny with expired key', function(done) {
      var expiry = Date.now() - 60000;
      var session = {id: 1, expiry: expiry};
      var secret = 's3cr3t';

      req.headers['x-securitytoken'] = token.encrypt(session, secret);
      var mw = index.check({secret: secret});
      res.send = function(code) {
        assert.equal(code, 403);
        done();
      };
      mw(req, res);
    });

    it('should deny with invalid key', function(done) {
      var secret = 's3cr3t';
      req.headers['x-securitytoken'] = 'whatever';
      var mw = index.check({secret: secret});
      res.send = function(code) {
        assert.equal(code, 403);
        done();
      };
      mw(req, res);
    });

  });

});
