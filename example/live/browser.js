var attractor = require('../../');
var observe = require('observable');

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

SortedList.prototype.select = function (elem) {
    this.active(elem.querySelector('.title').textContent);
};

SortedList.prototype.addItem = function () {
    console.log('TODO');
};

var attr = attractor({
    'x-chooser': [ require('attr-chooser'), 'active' ]
}, new SortedList);
attr.scan(document);
