var fs = require('fs'),
  assert = require('assert'),
  parser = require('xml2js').parseString,
  rbody = require('raw-body'),
  tpl = fs.readFileSync(__dirname + '/lib/response.xml', 'utf8'),
  token = require('./lib/token');


exports.auth = function(options, authorize) {
  options = options || {};

  assert(authorize, 'Auth handler function should be provided');
  options.ttl = (options.ttl || 86400) * 1000;

  return function(req, res, next) {

    rbody(req, {
      limit: '32kb',
      encoding: 'utf8'
    }, function (err, raw) {
      if (err)
        return next(err);

      parser(raw, function (err, result) {
        if (err) return res.send(422, err.message);

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
          return res.send(422, 'Cannot find UsernameToken entity');
        }

        authorize(credentials, function(err, session) {
          if (err) return next(err);
          if (!session) return res.send(401);

          var key = exports.makeKey(session, options);

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

  return function(req, res, next) {
    var session = token.decrypt(req.headers['x-securitytoken'], options.secret);

    if (!session || Date.now() > session.expiry) return res.send(403);

    req.session = session;
    next();
  };

};


exports.makeKey = function(session, options) {
  session.expiry = new Date(Date.now() + options.ttl).toISOString();
  return token.encrypt(session, options.secret);
};
