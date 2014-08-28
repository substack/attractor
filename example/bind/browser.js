var attractor = require('../../');
var observ = require('observ');

var scope = { yourName: observ() };
var attr = attractor({ 'binder': require('attr-bind') }, scope);
attr.scan(document);

window.scope = scope; // for messing around in the REPL
