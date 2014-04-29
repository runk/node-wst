var assert = require('assert'),
  storage = require('../lib/storage');


describe('lib/storage', function() {

  describe('set()', function() {
    it('should set the value', function(done) {
      storage.set('abc', {foo: 'bar'}, done);
    });
  });

  describe('get()', function() {
    it('should get the value', function(done) {
      storage.get('abc', function(err, value) {
        if (err) return done(err);
        assert.deepEqual(value, {foo: 'bar'});
        done();
      });
    });
  });

  describe('delete()', function() {
    it('should delete the value', function(done) {
      storage.delete('abc', function(err) {
        if (err) return done(err);
        storage.get('abc', function(err, value) {
          if (err) return done(err);
          assert.equal(value, undefined);
          done();
        });
      });
    });
  });

});
