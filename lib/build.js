var fs = require('fs')
  , path = require('path')
  , Builder = require('component-builder')
  , endsWith = require('./utils').endsWith
  , Batch = require('batch')
  , jade = require('jade')
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
  
  builder.hook('before scripts', function (pkg, cb) {
    if (!pkg.conf.templates) return cb();

    var jadeFiles = pkg.conf.templates.filter(endsWith('jade'))
      , batch = new Batch();

    jadeFiles.forEach(function (jadeTemplate) {
      batch.push(function (done) {
        var jadeTemplatePath = pkg.path(jadeTemplate)
          , template = jade.compile(fs.readFileSync(jadeTemplatePath, 'utf-8'));

        pkg.addFile('scripts', jadeTemplate, "module.exports = '" + template() + "';");
        
        done();
      });
    });
    batch.end(cb);
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
