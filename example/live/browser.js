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

document.querySelector('#new').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var title = this.elements.title.value;
    db.put('item!' + title, { score: 0, title: title });
    this.elements.title.value = '';
});

var live = require('attr-range')(function (rel) {
    var r = db.livefeed(rel.range).pipe(render());
    r.on('element', function (elem) { attr.scan(elem) });
    r.sortTo(rel.element, '.score');
});

var chooser = require('attr-chooser')('active', function (elem, ev, group) {
    active.set(elem.querySelector('.title').textContent);
});

var attractor = require('../../');
var attr = attractor({
    'data-start': live,
    'chooser': chooser
});
attr.scan(document);

var sock = require('shoe')('/sock');
sock.pipe(db.createRpcStream()).pipe(sock);
