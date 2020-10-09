function isHttpUrl(url) {
    if (url == undefined || url == "" || (!url.startsWith("http:") && !url.startsWith("https:"))) {
        return false;
    }
    return true;
}

function isEmpty(str) {
    return str == undefined || str == "" || str == null;
}

// 获取替换后的url
String.prototype.format = function () {
    if (arguments.length == 0) return this;
    var s = this;
    if (arguments.length == 1) {
        var first = arguments[0];
        if (first instanceof Object) {
            for (var firstKey in first) {
                s = s.replace(new RegExp("\\{" + firstKey + "\\}", "g"), first[firstKey]);
            }
        }
    } else {
        for (var i = 0; i < arguments.length; i++) {
            s = s.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i]);
        }
    }
    return s;
};