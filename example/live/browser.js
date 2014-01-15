var render = require('./render.js');
var db = require('multilevel-feed')();

var live = require('attr-range')(function (range) {
    var r = render();
    db.livefeed({ start: range.start, end: range.end }).pipe(r);
    r.on('element', function (elem) {
        attr.scan(elem);
    });
    r.sortTo(range.element, '.score');
});

var attractor = require('../../');
var attr = attractor({ 'data-start': live });
attr.scan(document);

var sock = require('shoe')('/sock');
sock.pipe(db.createRpcStream()).pipe(sock);
