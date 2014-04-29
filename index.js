var fs = require('fs'),
  assert = require('assert'),
  parser = require('xml2js').parseString,
  rbody = require('raw-body'),
  tpl = fs.readFileSync(__dirname + '/lib/response.xml', 'utf8'),
  token = require('./lib/token');


exports.auth = function(options) {
  options = options || {};

  assert(options.authorize, 'Auth handler function should be provided')
  assert(options.secret, 'Secret key should be provided')

  // options.storage = options.storage || storage;
  options.ttl = (options.ttl || 86400) * 1000;

  return function(req, res, next) {

    rbody(req, {
      limit: '32kb',
      encoding: 'utf8'
    }, function (err, raw) {
      if (err)
        return next(err);

      parser(raw, function (err, result) {
        if (err) return next(err);

        try {
          var request = result['S:Envelope']['S:Body'][0]['RequestSecurityToken'],
            utoken = request[0]['OnBehalfOf'][0]['wsse:UsernameToken'][0],
            u = utoken['wsse:Username'][0],
            p = utoken['wsse:Password'][0];

          var credentials = {
            username: typeof u === 'string' ? u : u._,
            password: typeof p === 'string' ? p : p._
          };
        } catch (e) {
          return next(new Error('Cannot find or parse UsernameToken entity'));
        }

        options.authorize(credentials, function(err, session) {
          if (err) return next(err);
          if (!session) return res.send(403);

          session.expiry = new Date(Date.now() + options.ttl).toISOString();
          var key = token.encrypt(session, options.secret);

          var map = {
            tsNow: new Date().toISOString(),
            tsValidity: new Date(Date.now() + 5000).toISOString(),
            tsExpiry: session.expiry,
            username: credentials.username,
            scope: options.scope,
            token: key
          };

          res.set('Content-Type', 'text/xml');
          res.send(tpl.replace(/%%(\w+)%%/g, function(p, w) {
            return map[w];
          }));
        });

      });
    });
  };
};


exports.check = function(options) {
  options = options || {};
  assert(options.secret, 'Secret key should be provided')

  return function(req, res, next) {
    var session = token.decrypt(req.headers['x-token'], options.secret);

    if (!session || Date.now() > session.expiry) return res.send(403);

    req.session = session;
    next();
  };

};
