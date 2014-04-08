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
                xs[k].test(elem);
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
    this.fns = [];
    this._tested = false;
    
    this.fn = fn(function f () {
        var args = arguments;
        
        if (!self._tested && self.fns.length === 0) {
            var next = function () { f.apply(null, args) };
            if (typeof setImmediate !== 'undefined') {
                setImmediate(next);
            }
            else setTimeout(next, 0);
        }
        
        for (var i = 0; i < self.fns.length; i++) {
            var p = self.fns[i];
            p.value.apply(p.context, args);
        }
    });
}

Match.prototype.test = function (elem) {
    var self = this;
    this._tested = true;
    
    if (!elem.getAttribute) return;
    if (indexOf(this.elements, elem) >= 0) return;
    var value = elem.getAttribute(this.key);
    if (value === null || value === undefined) return;
    
    for (var k = 0; k < this.extra.length; k++) {
        var v = elem.getAttribute(this.extra[k]);
        if (v === null || v === undefined) break;
    }
    if (k !== this.extra.length) return;
    
    var p = this.lookup(value);
    if (p && typeof p.value === 'function') {
        this.fns.push(p);
    }
    this.elements.push(elem);
    this.fn.apply(this.parent, [ elem, value ]);
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
