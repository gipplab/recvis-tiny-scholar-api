var fs = require('fs');
const bibtexParse = require('bibtex-parse');
var cache = require('persistent-cache');

var keyValueCache = cache();

function readFiles(dirname, onFileContent, onError) {
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function(filename) {
      fs.readFile(dirname + filename, 'utf-8', function(err, content) {
        if (err) {
          onError(err);
          return;
        }
        onFileContent(filename, content);
      });
    });
  });
}

var text_truncate = function(str, length, ending) {
    if (length == null) {
      length = 100;
    }
    if (ending == null) {
      ending = '...';
    }
    if (str.length > length) {
      return str.substring(0, length - ending.length) + ending;
    } else {
      return str;
    }
  };

readFiles('input/', function(filename, content) {
    if(filename.indexOf(".bibtex") > -1) {
        const parsedBibtex = bibtexParse.entries(content);
        if(parsedBibtex.length > 0) {
            const parsedMetadataFromBibtex = parsedBibtex[0];
            const title = parsedMetadataFromBibtex.TITLE;

            const textTruncateCharLimit = 30;
            const lowerCaseTrimmedSanitizedTitle = text_truncate(title.toLowerCase().trim().replace(/[^0-9a-z]/gi, ''), textTruncateCharLimit, '');

            const cachedResponse = keyValueCache.getSync(lowerCaseTrimmedSanitizedTitle);
            if(!cachedResponse) {
                keyValueCache.putSync(lowerCaseTrimmedSanitizedTitle, content);
                console.log("Successfully cached "+title);
            } else {
                console.log("This paper is already put into the cache: "+title);
            }

        } else {
            console.log("ERROR! Bad bibtex format for "+filename);
        }
    } else {
        console.log("Not bibtex file: "+filename);
    }
}, function(err) {
    throw err;
});