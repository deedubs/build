var fs = require('fs')
  , path = require('path')
  , Builder = require('component-builder')
  , componentStylus = require('component-stylus');

module.exports = Build;

function Build (dir) {
  var builder = this._builder = new Builder(dir);
  
  builder.use(componentStylus);
  
  builder.on('config', function () {
    builder.copyAssetsTo(builder.conf.build.output);

    builder.conf.paths && builder.conf.paths.forEach(function (path) {
      builder.addLookup(path);
    });
  });
}

Build.prototype.build = function (done) {
  var builder = this._builder;
  
  this._builder.build(function (err, res){
    if (err) return console.log(err);
  
    var requiredLocals = '';
   
    builder.conf.local && builder.conf.local.forEach(function (pkg) {
      requiredLocals += 'require("' + pkg + '");\n';
    });  

    fs.writeFileSync(path.join(builder.conf.build.output, builder.conf.name + '.js'), res.require + res.js + "require('" + builder.conf.name + "');\n" + requiredLocals);
    fs.writeFileSync(path.join(builder.conf.build.output, builder.conf.name + '.css'), res.css);

    done(builder.conf);
  });
};
