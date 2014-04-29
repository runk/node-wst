var assert = require('assert'),
  token = require('../lib/token');


describe('lib/token', function() {

  describe('encrypt()', function() {
    it('should encrypt the value', function() {
      assert.equal(token.encrypt('abc', 'pwd'), 'F//t7QCoCwzNCMQGtIgMzg==')
    });
  });

  describe('decrypt()', function() {
    it('should decrypt the value', function() {
      assert.equal(token.decrypt('F//t7QCoCwzNCMQGtIgMzg==', 'pwd'), 'abc')
    });
  });

});
