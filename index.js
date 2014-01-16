var expand = require('brace-expansion');

module.exports = Attractor;

function Attractor (attrs) {
    if (!(this instanceof Attractor)) return new Attractor(attrs);
    
    this._selectors = {};
    
    var keys = objectKeys(attrs || {});
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        this.add(key, attrs[key]);
    }
}

Attractor.prototype.add = function (key, cb) {
    var ex = expand(key);
    
    for (var i = 0; i < ex.length; i++) {
        var sel = '*[' + ex[i] + ']';
        var s = this._selectors[sel];
        if (!s) s = this._selectors[sel] = [];
        s.push({ index: i, attr: ex[i], cb: cb });
    }
};

Attractor.prototype.scan = function (root) {
    var keys = objectKeys(this._selectors);
    for (var i = 0; i < keys.length; i++) {
        var sel = keys[i];
        var attr = this._selectors[sel];
        var elems = root.querySelectorAll(sel);
        if (root.getAttribute && root.getAttribute(attr[0].attr)) {
            elems = [].slice.call(elems);
            elems.unshift(root);
        }
        
        for (var j = 0; j < elems.length; j++) {
            for (var k = 0; k < attr.length; k++) {
                attr[k].cb.call(this, elems[j], attr[k].attr, attr[k].index);
            }
        }
    }
};

var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
};
