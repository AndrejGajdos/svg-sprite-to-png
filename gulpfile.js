var gulp = require('gulp');
var fs = require('fs');
var rmdir = require('rmdir');
var del = require('del');
var svg2png = require('gulp-svg2png');
var DOMParser = require('xmldom').DOMParser;
var graphicsmagick = require('gulp-gm');
var rename = require('gulp-rename');
var timestamp = require('console-timestamp');
var namer = require('./ntc.js');
var config = require('./config.json');

gulp.task('default', function() {

  var colorName = getColorName(config.image.color).toString().replace(/\s/g, "_").toLowerCase();
  createFolders(colorName);

  // open svg sprite file
  fs.readFile(config.paths.svg_sprite, 'utf8', function(err, data) {
    if (err) {
      return console.log(timestamp('[hh:mm:ss] ') + "Read file " + config.paths.svg_sprite + " error: " + err);
    }

    console.log(timestamp('[hh:mm:ss] ') + "Creating .svg files...");

    var parser = new DOMParser();
    var svgSpriteContent = parser.parseFromString(data, "image/svg+xml");
    var symbols = svgSpriteContent.getElementsByTagName("symbol");

    for (var i = 0; i < symbols.length; i++) {
      // parse elements from svg sprite
      var paths = symbols.item(i).getElementsByTagName("path");

      var pathElement = null;
      if (paths.length > 1) {
        for (var x = 0; x < paths.length; x++) {
          var curPath = paths[x];
          curPath.setAttribute("fill", config.image.color);
          pathElement = pathElement + curPath.toString()
        }
      } else {
        var curPath = paths[0];
        curPath.setAttribute("fill", config.image.color);
        pathElement = curPath.toString()
      }
      var symbolId = symbols.item(i).getAttribute("id");
      var viewBoxVal = symbols.item(i).getAttribute("viewBox");
      var fileHeader = "<svg xmlns=\"http://www.w3.org/2000/svg\" style=\"display: none;\" viewBox=\"" + viewBoxVal + "\">";
      var fileFooter = "</svg>";

      // create separate svg files
      fs.writeFile("./build/svg_files_" + colorName + "/" + symbolId + ".svg",
        fileHeader + pathElement + fileFooter,
        function (err) {
          if (err) {
            return console.log(timestamp('[hh:mm:ss] ') + err);
          }
        });
    }

    console.log(timestamp('[hh:mm:ss] ') + "SVG separate files were created");
    console.log(timestamp('[hh:mm:ss] ') + "Creating .png files...");
    gulp.src("./build/svg_files_" + colorName + "/*.svg")
      .pipe(svg2png())
      .pipe(gulp.dest("./build/png_files_" + colorName))
      .on('end', function() {
        console.log(timestamp('[hh:mm:ss] ') + "PNG files were created");
        console.log(timestamp('[hh:mm:ss] ') + "Resizing PNG files...");
        gulp.src("./build/png_files_" + colorName + "/*.png")
          .pipe(graphicsmagick(function(gmfile) {
            return gmfile.resize(config.image.width, config.image.height);
          }))
          .pipe(gulp.dest("./build/png_files_" + colorName + "_" + config.image.width.toString() + "_" + config.image.height.toString()))
          .on('end', function() {
            del(["./build/png_files_" + colorName, "./build/svg_files_" + colorName], function(err, paths) {
              if (err) {
                return console.log(timestamp('[hh:mm:ss] ') + err);
              }
            });
          });
        console.log(timestamp('[hh:mm:ss] ') + "PNG files were resized");
      });
  });

});

/**
 * Convert color code to color name
 *
 * @param  {String} colorCode code of color in HEX or RGB format
 * @return {String}           color name
 */
function getColorName(colorCode) {
  var ntcResult = namer.ntc.name(colorCode);
  var result = {
    'inputColor': colorCode,
    'resultColorName': ntcResult[1],
    'resultColorHex': ntcResult[0],
    'exactMatch?': ntcResult[2]
  };
  console.log(timestamp('[hh:mm:ss] ') + "Name of color " + colorCode + " is " + result.resultColorName);
  return result.resultColorName;
}

/**
 * Create folders for file processing
 *
 * @param  {String} colorName
 */
function createFolders(colorName) {

  try {
    fs.mkdirSync("./build/svg_files_" + colorName);
  } catch (e) {
    if (e.code == 'EEXIST') {
      rmdir("./build/svg_files_" + colorName, function(err, dirs, files) {
        console.log(timestamp('[hh:mm:ss] ') + "All files in " + "./build/svg_files_" + colorName + " are removed");
      });
    } else {
      console.log(timestamp('[hh:mm:ss] ') + "Can't make the directory " + "./build/svg_files_" + colorName + " " + e);
    }
  }

  try {
    fs.mkdirSync("./build/png_files_" + colorName);
  } catch (e) {
    if (e.code == 'EEXIST') {
      rmdir("./build/png_files_" + colorName, function(err, dirs, files) {
        console.log(timestamp('[hh:mm:ss] ') + "All files in " + "./build/png_files_" + colorName + " are removed");
      });
    } else {
      console.log(timestamp('[hh:mm:ss] ') + "Can't make the directory " + "./build/png_files_" + colorName + " " + e);
    }
  }

  try {
    fs.mkdirSync("./build/png_files_" + colorName + "_" + config.image.width.toString() + "_" + config.image.height.toString());
  } catch (e) {
    if (e.code == 'EEXIST') {
      rmdir("./build/png_files_" + colorName + "_" + config.image.width.toString() + "_" + config.image.height.toString(), function(err, dirs, files) {
        console.log(timestamp('[hh:mm:ss] ') + "All files in " + "./build/png_files_" + colorName + "_" +
          config.image.width.toString() + "_" + config.image.height.toString() + " are removed");
      });
    } else {
      console.log(timestamp('[hh:mm:ss] ') + "Can't make the directory " +
        "./build/png_files_" + colorName + "_" + config.image.width.toString() + "_" + config.image.height.toString() + " " + e);
    }
  }

};
