/**
 *
 */
var host = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/";

/**
 * 替换js中的参数在执行
 */
function exe(fun) {
    var funStr = fun.toString().replace(/http:\/\/127.0.0.1:8081\//g, host);
    funStr = "return " + funStr;
    var jsCode = new Function(funStr)();
    var value = jsCode();
    return funStr;
}


function load(url) {
    window.location.href = url.replace("http://127.0.0.1:8081/", host);
}

