var attractor = require('../../');
var observe = require('observable');
var render = require('./render.js');

window.db = require('multilevel-feed')();
var sock = require('shoe')('/sock');
sock.pipe(db.createRpcStream()).pipe(sock);
 
function SortedList () {
    this.active = observe('');
    this.active(function (txt) {
console.log('txt=', txt); 
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
console.log('SELECT');
    this.active(elem.querySelector('.title').textContent);
};

SortedList.prototype.addItem = function () {
    console.log('TODO');
};

var attr = attractor({
    'x-chooser': [ require('attr-chooser'), 'active' ],
    'x-bind': require('attr-bind'),
    'x-range': [ require('attr-range'), 'data-start', 'data-end' ]
}, new SortedList);
attr.scan(document);
