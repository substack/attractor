var attractor = require('../../');
var range = require('attr-range');
var submit = require('attr-submit');
var chooser = require('attr-chooser');

var render = require('./render.js');
var observe = require('observable');

var db = require('multilevel-feed')();
var sock = require('shoe')('/sock');
sock.pipe(db.createRpcStream()).pipe(sock);

var attr = attractor();

attr.add('data-start', range(function (rel) {
    var r = db.livefeed(rel.range).pipe(render());
    r.on('element', function (elem) { attr.scan(elem) });
    r.sortTo(rel.element, '.score');
}));

attr.add('x-submit', submit(function (form, fields) {
    db.put('item!' + fields.title, { score: 0, title: fields.title });
    form.reset();
}));

attr.add('x-chooser', chooser('active', function (elem) {
    active(elem.querySelector('.title').textContent);
}));

var bind = require('attr-bind')();
attr.add('x-bind', bind);

var active = observe();
bind(active, 'active');

active(function (txt) {
    if (!txt) return;
    document.querySelector('h2').classList.remove('hide');
});

document.querySelector('#vote').addEventListener('click', function (ev) {
    var key = 'item!' + active();
    db.get(key, function (err, value) {
        value.score += 5;
        db.put(key, value);
    });
});

attr.scan(document);
window.db = db;
