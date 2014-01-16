var http = require('http');
var fs = require('fs');
var ecstatic = require('ecstatic')(__dirname + '/static');
var hyperstream = require('hyperstream');

var feed = require('multilevel-feed');
var level = require('level');
var db = level('/tmp/lists.db', { encoding: 'json' });

var render = require('./render.js');

var server = http.createServer(function (req, res) {
    var m = /\/(\w+)*(\?|$)/.exec(req.url);
    if (!m) return ecstatic(req, res);
    
    var name = m[1] || 'default';
    var items = db.createReadStream({ start: 'item!', end: 'item!\uffff' });
    
    fs.createReadStream(__dirname + '/html/index.html').pipe(hyperstream({
        '#name': name,
        '#list': {
            _html: items.pipe(render()),
            'data-start': items._options.start,
            'data-end': items._options.end
        }
    })).pipe(res);
});
server.listen(5000);

var shoe = require('shoe');
var sock = shoe(function (stream) { stream.pipe(feed(db)).pipe(stream) });
sock.install(server, '/sock');
