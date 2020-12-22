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

String.prototype.bootFormat = String.prototype.format;

// 将传输的字符串函数当方法。
function exeFun(funStr, operationId, customExtend) {
    funStr = "return " + funStr;
    var jsCode = new Function(funStr)();
    var value = jsCode(operationId, customExtend);
    return value;
}

var wpsCommon = {
    // 获取来自浏览器的参数 ,代替GetDocParamsValue()方法。
    getActiveDoc: function () {
        return wps.WpsApplication().ActiveDocument;
    },

    getDocAllParameter: function () {
        return JSON.parse(wps.PluginStorage.getItem(this.getActiveDoc().DocID));
    },

    getDocParameter: function (type) {
        var json = this.getDocAllParameter();
        if (type && type == "all") {
            return json;
        } else {
            json = json[type];
            return json || "";
        }
    },

    setDocParameter: function (key, value) {
        var json = this.getDocAllParameter();
        if (json) {
            json[key] = value;
        }
        //把属性值整体再写回原来的文档ID中
        wps.PluginStorage.setItem(this.getActiveDoc().DocID, JSON.stringify(json));
    }
}