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
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var sel = '*[' + key + ']';
        var rec = this._selectors[key];
        
        var elems = root.querySelectorAll(sel);
        if (root.getAttribute && root.getAttribute(key)) {
            elems = [].slice.call(elems);
            elems.unshift(root);
        }
        if (elems.length === 0) continue;
        
        for (var n = 0; n < rec.length; n++) {
            rec[n].test(elems);
        }
    }
};

function Match (opts, fn) {
    var self = this;
    this.key = opts.attrs[0];
    this.extra = opts.attrs.slice(1);
    this.lookup = opts.lookup;
    this.parent = opts.parent;
    this.listeners = {};
    this.elements = [];
    
    this.elemF = fn(function () {
        var keys = objectKeys(self.listeners);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var p = self.listeners[key];
            p.value.apply(p.context, arguments);
        }
    });
}

Match.prototype.test = function (elems) {
    for (var j = 0; j < elems.length; j++) {
        if (this.elements.indexOf(elems[j]) >= 0) continue;
        
        var values = [ elems[j].getAttribute(this.key) ];
        for (var k = 0; k < this.extra.length; k++) {
            var v = elems[j].getAttribute(this.extra[k]);
            if (v === null || v === undefined) break;
        }
        if (k !== this.extra.length) continue;
        
        for (var k = 0; k < values.length; k++) {
            var p = this.lookup(values[k]);
            if (!p) continue;
            var lx = this.listeners[values[k]];
            if (lx) continue;
            if (p && typeof p.value === 'function') {
                this.listeners[values[k]] = p;
            }
        }
        
        this.elements.push(elems[j]);
        this.elemF.apply(this.parent, [ elems[j] ].concat(values));
    }
};

var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
};
