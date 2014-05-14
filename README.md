node-wst
========

Dumb easy WS-Trust expressjs/connect middleware


## Installation

    npm i wst


## Usage

    var wst = require('wst');
    var opts = {
      ttl: 86400,
      secret: 's3cr3t' // long secret string
    };
    function authorize(credentials, cb) {
      if (credentials.username == 'bob' && credentials.password == 'secret')
        return cb(null, {userId: 1});
      cb(null, null);
    }

    // app = express();
    app.post('/auth/token', wst.auth(opts, authorize));
    app.post('/make/me/happy', wst.check(opts), function(req, res, next) {
      res.send('success');
    });
