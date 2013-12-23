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
  
  if (process.env.NODE_ENV !== 'production') {
    builder.addSourceURLs();
  }
  
  builder.on('config', function () {
    builder.copyAssetsTo(builder.config.build.output);

    builder.config.paths && builder.config.paths.forEach(function (path) {
      builder.addLookup(path);
    });
  });
  
  builder.hook('before scripts', function (pkg, cb) {
    if (!pkg.config.templates) return cb();

    var jadeFiles = pkg.config.templates.filter(endsWith('jade'))
      , batch = new Batch();

    jadeFiles.forEach(function (jadeTemplate) {
      batch.push(function (done) {
        var jadeTemplatePath = pkg.path(jadeTemplate)
          , template = jade.compile(fs.readFileSync(jadeTemplatePath, 'utf-8'),{filename:jadeTemplatePath});

        pkg.addFile('scripts', jadeTemplate, "module.exports = " + JSON.stringify(template()) + ";");
        
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
   
    builder.config.local && builder.config.local.forEach(function (pkg) {
      requiredLocals += 'require("' + pkg + '");\n';
    });  

    fs.writeFileSync(path.join(builder.config.build.output, builder.config.name + '.js'), res.require + res.js + "require('" + builder.config.name + "');\n" + requiredLocals);
    fs.writeFileSync(path.join(builder.config.build.output, builder.config.name + '.css'), res.css);

    done(builder.config);
  });
};
