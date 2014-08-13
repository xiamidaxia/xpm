var _ = require('underscore')

function File(filename, filecode) {
    this.filename = filename
    this.source = filecode
}

_.extend(File.prototype, {
    maxLineLength: function(ignoreOver) {
        var self = this;
        var m = 0;
        _.each(self.source.split('\n'), function(line) {
            if (line.length <= ignoreOver && line.length > m)
                m = line.length;
        });
        return m
    },
    pretty: function() {
        var self = this
        var chunks = []
        //Banner
        var bannerLines = [self.filename];
        if (self.bare) {
            bannerLines.push(
                "This file is in bare mode and is not in its own closure.");
        }
        var sourceWidth = _.max([68, self.maxLineLength(120 - 2)]);
        var width = sourceWidth || 70
        var bannerWidth = width + 3;
        var padding = bannerPadding(bannerWidth);
        chunks.push(banner(bannerLines, bannerWidth));
        var blankLine = new Array(width + 1).join(' ') + " //\n";
        chunks.push(blankLine);
        var numberifyLines = function (f) {
            var num = 1;
            var lines = self.source.split('\n');
            _.each(lines, function (line) {
                var suffix = "\n";

                if (line.length <= width && line[line.length - 1] !== "\\") {
                    suffix = padding.slice(line.length, width) + " // " + num + "\n";
                }
                f(line, suffix, num);
                num++;
            });
        };
        numberifyLines(function (line, suffix, num) {
            chunks.push(line + suffix);
        });
        chunks.push(dividerLine(bannerWidth))
        return chunks.join("")
    }
})

var banner = function(lines, bannerWidth) {
    if (!bannerWidth)
        bannerWidth = 6 + _.max(lines, function(x) { return x.length; }).length;

    var divider = dividerLine(bannerWidth);
    var spacer = "// " + new Array(bannerWidth - 6 + 1).join(' ') + " //\n";
    var padding = bannerPadding(bannerWidth);

    var buf = divider + spacer;
    _.each(lines, function(line) {
        buf += "// " + (line + padding).slice(0, bannerWidth - 6) + " //\n";
    });
    buf += spacer + divider;
    return buf;
};
var dividerLine = function(bannerWidth) {
    return new Array(bannerWidth + 1).join('/') + "\n";
};
var bannerPadding = function(bannerWidth) {
    return new Array(bannerWidth + 1).join(' ');
};

module.exports = function(filename, filecode) {
    return (new File(filename, filecode)).pretty()
}