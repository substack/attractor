var render = require('./render.js');
var db = require('multilevel-feed')();

var live = require('attr-range')(function (range) {
    db.livefeed(range).pipe(render().sortTo(range.element));
});

var attractor = require('../../');
var attr = attract({ 'data-start': live });

var shoe = require('shoe');
db.pipe(shoe('/sock')).pipe(db);
