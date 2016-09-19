var Q = require('q');
var fs = require('fs');
var path = require('path');
var crc = require('crc');
var exec = require('child_process').exec;
var mjAPI = require('MathJax-node/lib/mj-single.js');

var started = false;
var countMath = 0;
var cache = {};

/**
    Prepare MathJaX
*/
function prepareMathJax() {
    if (started) {
        return;
    }

    mjAPI.config({
        MathJax: {
            SVG: {
                font: 'TeX'
            }
        }
    });
    mjAPI.start();

    started = true;
}

/**
    Convert a tex formula into a SVG text

    @param {String} tex
    @param {Object} options
    @return {Promise<String>}
*/
function convertTexToSvg(tex, options) {
    var d = Q.defer();
    options = options || {};

    prepareMathJax();

    mjAPI.typeset({
        math:           tex,
        format:         (options.inline ? 'inline-TeX' : 'TeX'),
        svg:            true,
        speakText:      true,
        speakRuleset:   'mathspeak',
        speakStyle:     'default',
        ex:             6,
        width:          100,
        linebreaks:     true
    }, function (data) {
        if (data.errors) {
            return d.reject(new Error(data.errors));
        }

        d.resolve(options.write? null : data.svg);
    });

    return d.promise;
}

/**
    Process a math block

    @param {Block} blk
    @return {Promise<Block>}
*/
function processBlock(book, blk, isInline) {
    var tex = blk.body.replace(/\\([^a-zA-Z0-9 \\%])/g, "$1").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/\\{4}/g, '\\\\');

    // For website return as script
    var config = book.config.get('pluginsConfig.mathjax', {});

    if ((book.output.name == "website" || book.output.name == "json")
        && !config.forceSVG) {
        return '<script type="math/tex; '+(isInline? "": "mode=display")+'">'+tex+'</script>';
    }

    // Check if not already cached
    var hashTex = crc.crc32(tex).toString(16);

    // Return
    var imgFilename = '_mathjax_' + hashTex + '.svg';
    var img = '<img src="/' + imgFilename + '" />';

    // Center math block
    if (!isInline) {
        img = '<div style="text-align:center;margin: 1em 0em;width: 100%;">' + img + '</div>';
    }

    return {
        body: img,
        post: function() {
            if (cache[hashTex]) {
                return;
            }

            cache[hashTex] = true;
            countMath = countMath + 1;

            return convertTexToSvg(tex, { inline: isInline })
            .then(function(svg) {
                return book.output.writeFile(imgFilename, svg);
            });
        }
    };
}

/**
    Return assets for website

    @return {Object}
*/
function getWebsiteAssets() {
    var version = this.config.get('pluginsConfig.mathjax.version', 'latest');

    return {
        assets: "./book",
        js: [
            'https://cdn.mathjax.org/mathjax/' + version + '/MathJax.js?config=TeX-AMS-MML_HTMLorMML',
            'plugin.js'
        ]
    };
}

module.exports = {
    website: getWebsiteAssets,
    blocks: {
        math: {
            shortcuts: {
                parsers: ["markdown", "asciidoc"],
                start: "$$",
                end: "$$"
            },
            process: function(blk) {
                return processBlock(this, blk, false);
            }
        },
        inline_math: {
            shortcuts: {
                parsers: ["markdown", "asciidoc"],
                start: "$",
                end: "$"
            },
            process: function(blk) {
                return processBlock(this, blk, true);
            }
        }
    },
    hooks: {
        "page:before": function(page) {
          var preprocess_latex = function(str) {
            return str
              .replace(/\${1,2}([^\$]*)\\{([^\$]*)\${1,2}/g, '$$$1\\lbrace $2$$')
              .replace(/\${1,2}([^\$]*)\\}([^\$]*)\${1,2}/g, '$$$1\\rbrace $2$$')
              .replace(/([^\$]{1})\${1}([^\$]*)([^\\]{1})\\{2}([^\\]{1})([^\$]*)\${1}([^\$]{1})/g, '$1$$$2$3\\\\\\\\ $4$5$$$6');
          };

          var preprocess_latex_n = function(str, n) {
            for(i = 0; i < n; i++) {
              str = preprocess_latex(str);
            }
            return str;
          };
          page.content = preprocess_latex_n(page.content, 10);

          return page;
        }
    }
};
