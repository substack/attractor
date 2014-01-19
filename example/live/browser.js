var attractor = require('../../');
var observe = require('observable');
var render = require('./render.js');

window.db = require('multilevel-feed')();
var sock = require('shoe')('/sock');
sock.pipe(db.createRpcStream()).pipe(sock);
 
function SortedList () {
    this.active = observe('');
    this.active(function (txt) {
        if (!txt) return;
        document.querySelector('h2').classList.remove('hide');
    });
}

SortedList.prototype.range = function (xr) {
    var r = db.livefeed(xr.range).pipe(render());
    r.on('element', function (elem) { attr.scan(elem) });
    r.sortTo(xr.element, '.score');
};

SortedList.prototype.select = function (elem) {
    this.active(elem.querySelector('.title').textContent);
};

SortedList.prototype.addItem = function (form, fields) {
    db.put('item!' + fields.title, { score: 0, title: fields.title });
    form.reset();
};

var attr = attractor({
    'x-chooser': [ require('attr-chooser'), 'active' ],
    'x-bind': require('attr-bind'),
    'x-range': [ require('attr-range'), 'data-start', 'data-end' ],
    'x-submit': require('attr-submit')
}, new SortedList);
attr.scan(document);
