var expand = require('brace-expansion');
var isArray = require('isarray');
module.exports = Attractor;

function Attractor (attrs, scope) {
    if (!(this instanceof Attractor)) return new Attractor(attrs, scope);
    
    this._selectors = {};
    this.scope = scope || {};
    
    var keys = objectKeys(attrs || {});
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        this.add(key, attrs[key]);
    }
}

Attractor.prototype.lookup = function (str) {
    var keys = str.split('.');
    var node = this.scope, context = null;
    for (var i = 0; i < keys.length; i++) {
        context = node;
        node = node[keys[i]];
        if (!node) return null;
    }
    return { context: context, value: node };
};

Attractor.prototype.add = function (key, cb) {
    var self = this;
    var ex = expand(key);
    if (isArray(cb)) {
        cb = (function (args) {
            if (typeof args[0] !== 'function') {
                throw new Error(
                    'first element in .add(array) must be a function'
                );
            }
            return function () {
                var argv = args.slice(1).concat([].slice.call(arguments));
                return args[0].apply(this, argv);
            };
        })(cb);
    }
    
    var s = this._selectors[ex[0]];
    if (!s) s = this._selectors[ex[0]] = [];
    
    s.push(new Match({
        attrs: ex,
        parent: this,
        lookup: function (key) { return self.lookup(key) }
    }, cb));
};

Attractor.prototype.scan = function (root) {
    var self = this;
    var keys = objectKeys(this._selectors);
    
    var sels = [];
    for (var i = 0; i < keys.length; i++) {
        sels.push('*[' + keys[i] + ']');
    }
    var sel = sels.join(',');
    var elems = [].slice.call(root.querySelectorAll(sel));
    elems.unshift(root);
    
    for (var i = 0; i < elems.length; i++) {
        var elem = elems[i];
        for (var j = 0; j < keys.length; j++) {
            var key = keys[j];
            var xs = this._selectors[key];
            for (var k = 0; k < xs.length; k++) {
                xs[k].register(elem);
            }
        }
    }
};

function Match (opts, fn) {
    var self = this;
    this.key = opts.attrs[0];
    this.extra = opts.attrs.slice(1);
    this.lookup = opts.lookup;
    this.parent = opts.parent;
    this.elements = [];
    this.fn = fn;
}

Match.prototype.register = function (elem) {
    var self = this;
    if (!elem.getAttribute) return false;
    if (indexOf(this.elements, elem) >= 0) return false;
    var value = elem.getAttribute(this.key);
    if (value === null || value === undefined) return false;
    
    for (var k = 0; k < this.extra.length; k++) {
        var v = elem.getAttribute(this.extra[k]);
        if (v === null || v === undefined) return false;
    }
    this.elements.push(elem);
    
    var ff = this.fn(function () {
        var p = self.lookup(value);
        if (p && typeof p.value === 'function') {
            p.value.call(p.context, elem, value);
        }
    });
    if (ff) ff.call(this.parent, elem, value);
};

var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
};

function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (xs[i] === x) return i;
    }
    return -1;
}
