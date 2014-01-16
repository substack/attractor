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
        var s = this._selectors[ex[i]];
        if (!s) s = this._selectors[ex[i]] = { ex: ex, cb: [] };
        s.cb.push(cb);
    }
};

Attractor.prototype.scan = function (root) {
    var keys = objectKeys(this._selectors);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var sel = '*[' + key + ']';
        var rec = this._selectors[key];
        
        var elems = root.querySelectorAll(sel);
        if (root.getAttribute && root.getAttribute(key)) {
            elems = [].slice.call(elems);
            elems.unshift(root);
        }
        
        for (var j = 0; j < elems.length; j++) {
            var args = [ elems[j] ];
            for (var k = 0; k < rec.ex.length; k++) {
                args.push(elems[j].getAttribute(rec.ex[k]));
            }
            
            for (var k = 0; k < rec.cb.length; k++) {
                rec.cb[k].apply(this, args);
            }
        }
    }
};

var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
};
