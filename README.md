node-wst
========

Dumb easy WS-Trust expressjs/connect middleware


## Installation

    npm i wst


## Usage

    var wst = require('wst');
    var authorizer = function(credentials, cb) {
      cb(null, (credentials.username == 'bob' && credentials.password == 'secret'));
    };

    // app = express();
    app.use(wst({authorize: authorizer, ttl: 86400}));


## Session persistence

By default middleware keeps all tokens in memory, however you can override this behaviour by using
custom token storage object.

    var myStorage = {
      get: function(token, cb) { /* ... */ },
      set: function(token, meta, cb) { /* ... */ },
      delete: function(token, cb) { /* ... */ }
    };

    app.use(wst({authorize: authorizer, storage: myStorage}));
