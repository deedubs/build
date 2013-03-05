var watch = require('watch')
  , debug = require('debug')('build')
  , Build = require('./build');

module.exports = function (dir) {
  var b = new Build(dir)
    , inprogress;

  debug('Watching: %s', dir);

  watch.watchTree(dir, function (file) {
    if (typeof file == "object") return;

    if (file.match(/public/) || file == inprogress) return;
    
    inprogress = file;
    b.build(function (package) {
      inprogress = null;
      
      debug('Package Built: %s because of %s', package.name, file);
    });
  })
}