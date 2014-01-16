var render = require('./render.js');
var db = require('multilevel-feed')();
var observe = require('observ');
var active = observe();

active(function (txt) {
    document.querySelector('#active').textContent = txt;
    document.querySelector('#vote').classList.remove('hide');
});

document.querySelector('#vote').addEventListener('click', function (ev) {
    var key = 'item!' + active();
    db.get(key, function (err, value) {
        value.score += 5;
        db.put(key, value);
    });
});

var live = require('attr-range')(function (rel) {
    var r = db.livefeed(rel.range).pipe(render());
    r.on('element', function (elem) { attr.scan(elem) });
    r.sortTo(rel.element, '.score');
});

var chooser = require('attr-chooser')('active', function (elem) {
    active.set(elem.querySelector('.title').textContent);
});

var submit = require('attr-submit')(function (form, fields) {
    db.put('item!' + fields.title, { score: 0, title: fields.title });
    form.reset();
});

var attractor = require('../../');
var attr = attractor({
    'data-start': live,
    'x-submit': submit,
    'x-chooser': chooser
});
attr.scan(document);

var sock = require('shoe')('/sock');
sock.pipe(db.createRpcStream()).pipe(sock);
