var _ = require('lodash');
var path = require('path');
var through = require('through');

var transformTools = require('browserify-transform-tools');

var replaceRFRModule = transformTools.makeRequireTransform("rfrModule", {evaluateArguments: true}, function(args, opts, cb) {
    if (args[0] == 'rfr') {
        return cb(null, "require("+JSON.stringify(path.resolve(__dirname, 'rfr.js'))+")");
    } else {
        return cb();
    }
});

var replaceRFRCall = transformTools.makeFalafelTransform("rfrCall", {}, function(node, transformOptions, done) {
    if (node.type == 'CallExpression'
        && node.callee.type == 'Identifier'
        && node.callee.name == 'rfr') {

        var dirname = path.dirname(transformOptions.file)
        var varNames = ['__filename', '__dirname', 'path', 'join']
        var vars = [transformOptions.file, dirname, path, path.join]

        var args = _.map(node.arguments, function(arg) {
            t = "return "+arg.source();
            try {
                return Function(varNames, t).apply(null, vars);
            } catch (err) {
                // Can't evaluate the arguemnts.  Return the raw source.
                return arg.source()
            }
        });

        var root = path.resolve(process.cwd(), transformOptions.config.root || "");
        var requirePath = args[0];
        var newPath = './'+path.relative(path.dirname(transformOptions.file), path.join(root, requirePath));

        node.update('require('+JSON.stringify(newPath)+')');
        done();

    } else done();
});

var transforms = [replaceRFRModule, replaceRFRCall];
module.exports = function(file, opts) {
    var content = "";

    return through(function write (buf) {
        content += buf
    }, function end () {
        var that = this;
        var i = 0;

        function callTransform(_content) {
            var data = "";
            var transform = transforms[i];
            if (!transform) {
                that.queue(_content);
                that.queue(null);

                return;
            }

            var throughStream = transform(file, opts);

            throughStream.on("data", function(d) {
                data = data + d;
            });
            throughStream.on("end", function(err) {
                if (!err) {
                    i = i + 1;
                    callTransform(data);
                }
            });
            throughStream.on("error", function(e) {
                that.emit('error', e);
            });

            throughStream.write(_content);
            throughStream.end();
        }

        callTransform(content);
    });
};

