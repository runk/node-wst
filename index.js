var fs = require('fs'),
  parser = require('xml2js').parseString,
  rbody = require('raw-body'),
  tpl = fs.readFileSync(__dirname + '/lib/response.xml', 'utf8'),
  uuid = require('./lib/uuid'),
  storage = require('./lib/storage');


module.exports = function(options) {

  if (!options || !options.authorize)
    throw new Error('Auth handler function should be provided');

  options.storage = options.storage || storage;
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
            token = request[0]['OnBehalfOf'][0]['wsse:UsernameToken'][0],
            u = token['wsse:Username'][0],
            p = token['wsse:Password'][0];

          var credentials = {
            username: typeof u === 'string' ? u : u._,
            password: typeof p === 'string' ? p : p._
          };
        } catch (e) {
          return next(new Error('Cannot find or parse UsernameToken entity'));
        }

        options.authorize(credentials, function(err, grant) {
          if (err) return next(err);
          if (!grant) return res.send(403);

          var token = uuid(),
            expiry = new Date(Date.now() + options.ttl).toISOString();

          options.storage.set(token, {expiry: Date.now() + options.ttl}, function(err) {
            if (err) return next(err);

            var map = {
              tsNow: new Date().toISOString(),
              tsValidity: new Date(Date.now() + 5000).toISOString(),
              tsExpiry: expiry,
              username: credentials.username,
              scope: options.scope,
              token: token
            };

            res.set('Content-Type', 'text/xml');
            res.send(tpl.replace(/%%(\w+)%%/g, function(p, w) {
              return map[w];
            }));
          });

        });

      });
    });
  };
};


module.exports.check = function(options) {

  options = options || {};
  options.storage = options.storage || storage;

  return function(req, res, next) {
    var token = req.headers['x-token'];
    options.storage.get(token, function(err, meta) {
      if (err) return next(err);
      if (!meta) return res.send(403);

      if (Date.now() < meta.expiry) return next();

      options.storage.delete(token, function(err) {
        if (err) return next(err);
        res.send(403);
      });
    });
  };

};
