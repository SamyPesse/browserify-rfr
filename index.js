var _ = require('lodash');
var path = require('path');
var through = require('through');
var jstransform = require('jstransform');
var utils = require('jstransform/src/utils');

var Syntax = jstransform.Syntax;

// Create a visitor for jstransform to replace "rfr" calls
function createTransformation(root, currentFile) {
    function replaceRFR(traverse, node, transformPath, state) {
        if (node.arguments.length == 0) throw "rfr need at least one argument";
        var requirePath = node.arguments[0].value;
        var newPath = './'+path.relative(path.dirname(currentFile), path.join(root, requirePath));

        utils.catchup(node.range[0], state);
        utils.append('require('+JSON.stringify(newPath)+')', state);
        utils.move(node.range[1], state);
    }
    replaceRFR.test = function(node, path, state) {
      return node.type === Syntax.CallExpression
             && node.callee.type === Syntax.Identifier
             && node.callee.name === 'rfr';
    };

    return replaceRFR;
}

module.exports = function(file, opts) {
    if (/\.json$/.test(file)) return through();
    var root = path.resolve(process.cwd(), opts.root || "");
    var data = '';

    return through(write, end);

    function write (buf) { data += buf }
    function end () {
        try {
            var transformedData = jstransform.transform(
                [createTransformation(root, file)],
                data
            );
        } catch(err) {
            return this.emit('error', err)
        }

        this.queue(transformedData.code);
        this.queue(null);
    }
};
