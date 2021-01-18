/**
 * 这是浏览器与WPS通信的SDK，是WPS提供的SDK
 * 无需修改
 * 直接引用到业务系统前端调用即可
 * 可覆盖如下使用场景：
 *  1. 通过浏览器中的页面直接启动WPS
 *  2. 浏览器与WPS双向通信，WPS发消息，浏览器前端页面可接受并解析
 */

;
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ?
        module.exports = factory(global) :
        typeof define === 'function' && define.amd ?
            define(factory) : factory(global)
}((
    typeof self !== 'undefined' ? self :
        typeof window !== 'undefined' ? window :
            typeof global !== 'undefined' ? global :
                this
), function (global) {
    global = global || {};
    var bFinished = true;

    function getHttpObj() {
        var httpobj = null;
        if (IEVersion() < 10) {
            try {
                httpobj = new XDomainRequest();
            } catch (e1) {
                httpobj = new createXHR();
            }
        } else {
            httpobj = new createXHR();
        }
        return httpobj;
    }

    //兼容IE低版本的创建xmlhttprequest对象的方法
    function createXHR() {
        if (typeof XMLHttpRequest != 'undefined') { //兼容高版本浏览器
            return new XMLHttpRequest();
        } else if (typeof ActiveXObject != 'undefined') { //IE6 采用 ActiveXObject， 兼容IE6
            var versions = [ //由于MSXML库有3个版本，因此都要考虑
                'MSXML2.XMLHttp.6.0',
                'MSXML2.XMLHttp.3.0',
                'MSXML2.XMLHttp'
            ];

            for (var i = 0; i < versions.length; i++) {
                try {
                    return new ActiveXObject(versions[i]);
                } catch (e) {
                    //跳过
                }
            }
        } else {
            throw new Error('您的浏览器不支持XHR对象');
        }
    }

    function startWps(options) {
        if (!bFinished && !options.concurrent) {
            if (options.callback)
                options.callback({
                    status: 1,
                    message: "上一次请求没有完成"
                });
            return;
        }
        bFinished = false;

        function startWpsInnder(tryCount) {
            if (tryCount <= 0) {
                if (bFinished)
                    return;
                bFinished = true;
                if (options.callback)
                    options.callback({
                        status: 2,
                        message: "请允许浏览器打开WPS Office"
                    });
                return;
            }
            var xmlReq = getHttpObj();
            //WPS客户端提供的接收参数的本地服务，HTTP服务端口为58890，HTTPS服务端口为58891
            //这俩配置，取一即可，不可同时启用
            xmlReq.open('POST', options.url);
            xmlReq.onload = function (res) {
                bFinished = true;
                if (options.callback) {
                }
                options.callback({
                    status: 0,
                    response: IEVersion() < 10 ? xmlReq.responseText : res.target.response
                });
            }
            xmlReq.ontimeout = xmlReq.onerror = function (res) {
                xmlReq.bTimeout = true;
                if (tryCount == options.tryCount && options.bPop) { //打开wps并传参
                    window.location.href = "ksoWPSCloudSvr://start=RelayHttpServer" //是否启动wps弹框
                }
                setTimeout(function () {
                    startWpsInnder(tryCount - 1)
                }, 1000);
            }
            if (IEVersion() < 10) {
                xmlReq.onreadystatechange = function () {
                    if (xmlReq.readyState != 4)
                        return;
                    if (xmlReq.bTimeout) {
                        return;
                    }
                    if (xmlReq.status === 200)
                        xmlReq.onload();
                    else
                        xmlReq.onerror();
                }
            }
            xmlReq.timeout = options.timeout;
            xmlReq.send(options.sendData)
        }

        startWpsInnder(options.tryCount);
        return;
    }

    var fromCharCode = String.fromCharCode;
    // encoder stuff
    var cb_utob = function (c) {
        if (c.length < 2) {
            var cc = c.charCodeAt(0);
            return cc < 0x80 ? c :
                cc < 0x800 ? (fromCharCode(0xc0 | (cc >>> 6)) +
                    fromCharCode(0x80 | (cc & 0x3f))) :
                    (fromCharCode(0xe0 | ((cc >>> 12) & 0x0f)) +
                        fromCharCode(0x80 | ((cc >>> 6) & 0x3f)) +
                        fromCharCode(0x80 | (cc & 0x3f)));
        } else {
            var cc = 0x10000 +
                (c.charCodeAt(0) - 0xD800) * 0x400 +
                (c.charCodeAt(1) - 0xDC00);
            return (fromCharCode(0xf0 | ((cc >>> 18) & 0x07)) +
                fromCharCode(0x80 | ((cc >>> 12) & 0x3f)) +
                fromCharCode(0x80 | ((cc >>> 6) & 0x3f)) +
                fromCharCode(0x80 | (cc & 0x3f)));
        }
    };
    var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
    var utob = function (u) {
        return u.replace(re_utob, cb_utob);
    };
    var _encode = function (u) {
        var isUint8Array = Object.prototype.toString.call(u) === '[object Uint8Array]';
        if (isUint8Array)
            return u.toString('base64')
        else
            return btoa(utob(String(u)));
    }

    if (typeof global.btoa !== 'function') global.btoa = func_btoa;

    function func_btoa(input) {
        var str = String(input);
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        for (
            // initialize result and counter
            var block, charCode, idx = 0, map = chars, output = '';
            // if the next str index does not exist:
            //   change the mapping table to "="
            //   check if d has no fractional digits
            str.charAt(idx | 0) || (map = '=', idx % 1);
            // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
            output += map.charAt(63 & block >> 8 - idx % 1 * 8)
        ) {
            charCode = str.charCodeAt(idx += 3 / 4);
            if (charCode > 0xFF) {
                throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
            }
            block = block << 8 | charCode;
        }
        return output;
    }

    var encode = function (u, urisafe) {
        return !urisafe ?
            _encode(u) :
            _encode(String(u)).replace(/[+\/]/g, function (m0) {
                return m0 == '+' ? '-' : '_';
            }).replace(/=/g, '');
    };

    function IEVersion() {
        var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
        var isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1; //判断是否IE<11浏览器
        var isEdge = userAgent.indexOf("Edge") > -1 && !isIE; //判断是否IE的Edge浏览器
        var isIE11 = userAgent.indexOf('Trident') > -1 && userAgent.indexOf("rv:11.0") > -1;
        if (isIE) {
            var reIE = new RegExp("MSIE (\\d+\\.\\d+);");
            reIE.test(userAgent);
            var fIEVersion = parseFloat(RegExp["$1"]);
            if (fIEVersion == 7) {
                return 7;
            } else if (fIEVersion == 8) {
                return 8;
            } else if (fIEVersion == 9) {
                return 9;
            } else if (fIEVersion == 10) {
                return 10;
            } else {
                return 6; //IE版本<=7
            }
        } else if (isEdge) {
            return 20; //edge
        } else if (isIE11) {
            return 11; //IE11
        } else {
            return 30; //不是ie浏览器
        }
    }

    function WpsStart(clientType, name, func, param, useHttps, callback, tryCount, bPop) {
        var startInfo = {
            "name": name,
            "function": func,
            "info": param
        };
        var strData = JSON.stringify(startInfo);
        if (IEVersion() < 10) {
            try {
                eval("strData = '" + JSON.stringify(startInfo) + "';");
            } catch (err) {

            }
        }

        var baseData = encode(strData);
        var url = "http://127.0.0.1:58890/" + clientType + "/runParams";
        if (useHttps)
            url = "https://127.0.0.1:58891/" + clientType + "/runParams";
        var data = "ksowebstartup" + clientType + "://" + baseData;
        startWps({
            url: url,
            sendData: data,
            callback: callback,
            tryCount: tryCount,
            bPop: bPop,
            timeout: 5000,
            concurrent: false
        });
    }

    function WpsStartWrap(clientType, name, func, param, callback) {
        WpsStart(clientType, name, func, param, false, callback, 4, true)
    }

    function WpsStartWrapHttps(clientType, name, func, param, callback) {
        WpsStart(clientType, name, func, param, true, callback, 4, true)
    }

    var exId = 0;

    /**
     * 支持浏览器触发，WPS有返回值的启动
     *
     * @param {*} clientType    组件类型
     * @param {*} name            WPS加载项名称
     * @param {*} func            WPS加载项入口方法
     * @param {*} param            参数：包括WPS加载项内部定义的方法，参数等
     * @param {*} useHttps        是否使用https协议
     * @param {*} callback        回调函数
     * @param {*} tryCount        重试次数
     * @param {*} bPop            是否弹出浏览器提示对话框
     */
    function WpsStartWrapExInner(clientType, name, func, param, useHttps, callback, tryCount, bPop) {
        var rspUrl = "http://127.0.0.1:58890/transferEcho/runParams";
        if (useHttps)
            rspUrl = "https://127.0.0.1:58891/transferEcho/runParams";
        var time = new Date();
        var cmdId = "js" + time.getTime() + "_" + exId;
        var infocontent = JSON.stringify(param);
        var funcEx = "var res = " + func;
        var cbCode = "var xhr = new XMLHttpRequest();xhr.open('POST', '" + rspUrl + "');xhr.send(JSON.stringify({id: '" + cmdId + "', response: res}));" //res 为func执行返回值
        var infoEx = infocontent + ");" + cbCode + "void(0";
        //固定格式，无需修改
        var startInfo = {
            "name": name,
            "function": funcEx,
            "info": infoEx
        };
        var strData = JSON.stringify(startInfo);
        if (IEVersion() < 10) {
            try {
                eval("strData = '" + JSON.stringify(startInfo) + "';");
            } catch (err) {

            }
        }

        var baseData = encode(strData);
        var url = "http://127.0.0.1:58890/transfer/runParams";
        if (useHttps)
            url = "https://127.0.0.1:58891/transfer/runParams";
        var data = "ksowebstartup" + clientType + "://" + baseData;
        var wrapper = {
            id: cmdId,
            app: clientType,
            data: data
        };
        wrapper = JSON.stringify(wrapper);
        startWps({
            url: url,
            sendData: wrapper,
            callback: callback,
            tryCount: tryCount,
            bPop: bPop,
            timeout: 0,
            concurrent: true
        });
    }

    var serverVersion = "wait"

    function WpsStartWrapVersionInner(clientType, name, func, param, useHttps, callback) {
        if (serverVersion == "wait") {
            var url = "http://127.0.0.1:58890/version";
            if (useHttps)
                url = "https://127.0.0.1:58891/version";
            startWps({
                url: url,
                data: "",
                callback: function (res) {
                    if (res.status !== 0) {
                        callback(res)
                        return;
                    }
                    serverVersion = res.response;
                    if (serverVersion === "") {
                        WpsStart(clientType, name, func, param, useHttps, callback, 1, false);
                    } else {
                        WpsStartWrapExInner(clientType, name, func, param, useHttps, callback, 1, false);
                    }
                },
                tryCount: 4,
                bPop: true,
                timeout: 5000
            });
        } else {
            if (serverVersion === "") {
                //todo-1 修改1.参数参送错误修改
                WpsStartWrap(clientType, name, func, param, callback);
            } else {
                WpsStartWrapExInner(clientType, name, func, param, useHttps, callback, 1, true);
            }
        }
    }

    var RegWebNotifyID = null

    /**
     * 注册一个前端页面接收WPS传来消息的方法
     * @param {*} clientType wps | et | wpp
     * @param {*} name WPS加载项的名称
     * @param {*} callback 回调函数
     */
    function RegWebNotify(clientType, name, callback) {
        if (RegWebNotifyID) {
            return
        }

        RegWebNotifyID = new Date().valueOf() + ''
        var paramStr = {
            id: RegWebNotifyID,
            name: name,
            type: clientType
        }
        var askItem = function () {
            var xhr = WpsInvoke.CreateXHR()
            xhr.onload = function (e) {
                callback(xhr.responseText)
                window.setTimeout(askItem, 300)
            }
            xhr.onerror = function (e) {
                window.setTimeout(askItem, 10000)
            }
            xhr.ontimeout = function (e) {
                window.setTimeout(askItem, 10000)
            }
            if (IEVersion() < 10) {
                xhr.onreadystatechange = function () {
                    if (xhr.readyState != 4)
                        return;
                    if (xhr.bTimeout) {
                        return;
                    }
                    if (xhr.status === 200)
                        xhr.onload();
                    else
                        xhr.onerror();
                }
            }
            xhr.open('POST', 'http://127.0.0.1:58890/askwebnotify', true)
            xhr.send(JSON.stringify(paramStr))
        }

        window.setTimeout(askItem, 2000)
    }

    function WpsStartWrapVersion(clientType, name, func, param, callback) {
        WpsStartWrapVersionInner(clientType, name, func, param, false, callback);
    }

    function WpsStartWrapHttpsVersion(clientType, name, func, param, callback) {
        WpsStartWrapVersionInner(clientType, name, func, param, true, callback);
    }


    //20200930新增
    global.WpsInvoke = {
        InvokeAsHttp: WpsStartWrapVersion,
        InvokeAsHttps: WpsStartWrapHttpsVersion,
        RegWebNotify: RegWebNotify,
        IEVersion: IEVersion,
        encode: encode,
        startWps: startWps,
        ClientType: {
            wps: "wps",
            et: "et",
            wpp: "wpp"
        },
        CreateXHR: createXHR,
        //WpsAddonMgr : WpsAddonMgr,
    }

    return {
        WpsInvoke: global.WpsInvoke
    }
}));


// 自定义封装
(function (window, document, $) {
    var fileOpenPlugin = {
        wps: ["doc", "docx", "wps"],
        et: ["xls", "xlsx"],
        wpp: ["ppt", "pptx"],
    }

    //引入wps_sdk
    var infoAlert = function (error, message) {
        if (error) {
            console.error(message);
            alert(message);
        } else {
            console.info(message);
            alert(message);
        }
    }

    var check = function (me, edit) {
        if (me.fileUploadPath == "") {
            infoAlert(true, "文件的上传路径不能为空！");
            return false;
        }
        if (edit && me.fileLoadPath == "") {
            infoAlert(true, "文件的加载路径不能为空！");
            return false;
        }
        return true;
    }

    var addToken = function (me) {
        if (me.token) {
            for (var index in me) {
                var temp = me[index];
                if (typeof temp == "string" && wpsApi.wpsExtend.isHttpUrl(temp)) {
                    var number = temp.indexOf("?");
                    // 说明有参数
                    if (number > -1 && temp.length - 1 > number) {
                        me[index] += "&" + me.token.tokenName + "=" + me.token.tokenValue;
                    }
                }
            }
        }
        return me;
    }

    // wps提供的一次可以打开多个文档，这里只提供一次打开一个
    function WpsApi(options) {
        //this.element = element;
        //this.debug = options.debug || false; //debug模式不打开 ， 开启打印日志
        //this.autoLoad = options.autoLoad || false; // 自动调用load方法加载文件，不需要再.load方法
        this.methodTypes = {
            add: "NewDoc", edit: "OpenDoc", exit: "ExitWPS", status: "GetDocStatus",
            replace: "ReplaceDoc", insertText: "insertText",
        }
        this.https = options.https || false; //是否使用https协议调用wps。默认使用http


        this.fileLoadPath = options.fileLoadPath || ""; //文档加载地址
        this.docId = options.docId;  // 文档id
        this.fileUploadPath = options.fileUploadPath || ""; //文档保存上载地址
        this.userName = options.userName; //用户名
        this.buttonGroups = options.buttonGroups; // 按钮控制器
        // 自定义数据
        this.uploadFieldName = options.uploadFieldName;
        //模式打开 // 文档保护类型，-1：不启用保护模式，0：只允许对现有内容进行修订，1：只允许添加批注，2：只允许修改窗体域(禁止拷贝功能)，3：只读
        this.protectType = options.protectType || null;
        this.password = options.password;  // 密码
        this.docPassword = options.docPassword || null;  // 文档密码
        this.openRevision = options.openRevision || false; // 是否显示痕迹，和控制痕迹按钮无关

        this.saveSuffix = options.saveSuffix || null; // 保存文档格式 pdf ofd uof uot (测试过可以的)

        // 获取文档状态
        //this.getState = options.getState || false;

        // 套红头,需添加正文的标签或则[正文]的替换字段
        //自定义，该方法放弃
        this.customRedFileUrl = options.customRedFileUrl;
        //this.insertFileUrl = options.insertFileUrl || null; // 模板地址 pInsertRInedHead()
        this.bkInsertFile = options.bkInsertFile || "";  //自动套红头 ， 默认使用[正文]替换 ,
        this.redFileElement = options.redFileElement || "";
        // 获取红头选择文件列表url,返回一个json数据[{id: name:}];
        // 多于10个模板自动出现搜索参数，参数名 ：search
        this.customRedFileListUrl = options.customRedFileListUrl;
        this.customRedFileBaseUrl = options.customRedFileBaseUrl;

        this.customRepJsonDataUrl = options.customRepJsonDataUrl; // 方式一，通过url获取替换字段数据
        this.repFileElement = options.repFileElement || ""; // 方式二，直接传替换数据字段进行解析

        // 历史版本url页面
        this.fileVersionPagePathUrl = options.fileVersionPagePathUrl || "";
        /**
         *
         * @type {*|string}
         * [{
         *      "keyName": "密级",
         *      "keyValue": "",
         *      "keyType": 1 //直接替换
         * },
         * {
         *      "keyName": "领导批示",
         *      "keyValue": "[{\"keyText\":null,\"keyValue\":\"\",\"userName\":\"\",\"userPicUrl\":null,\"keyDate\":\"\",\"userPicSize\":0,\"fontSize\":0}]",
         *      "keyType": 2 // json字串带格式的替换
         * },
         * ]
         */
        //this.repFileElement = options.repFileElement || "";  // 其他替换字段，模板如下

        // 默认关闭所有的按钮按钮,不默认频闭就自己加按钮
        this.defalutCloseAllButton = options.defalutCloseButton && true;

        if (this.defalutCloseAllButton || !options.buttonGroups) {
            var str = wpsApi.wpsAllButtonGroups();
            this.buttonGroups = str.slice(0, str.length - 1);
        } else {
            var str = wpsApi.wpsAllButtonGroups();
            var arr = options.buttonGroups.split(",");
            for (var index in arr) {
                str = str.replace(arr[index], "");
            }
            this.buttonGroups = str;
        }
        // 是否走动保存文件到服务器 ，自动保存回OA服务端的时间间隔。如果设置0，则关闭，最小设置3分钟
        this.autoSaveToServer = options.autoSaveToServer || wpsApi.wpsInitParams.autoSaveToServer;

        //保存之后的回调函数 ， 在有这个回调方法的时候才会和wps之间进行通信
        this.saveCallback = options.saveCallback;
        // js调起wps之后执行的方法
        this.openCallback = options.openCallback;

        // token = {tokenName : jwtToken , tokenValue : aaaaaadadadadasd}
        this.token = options.token;
        this.dispatcherPrefixFunction = options.dispatcherPrefixFunction || "";

        //用户自定义数据
        this.customExtend = options.customExtend;

        // 转换pdf等按钮默认只转一次，现在调用OnBtnSaveToServer方法，让其可以
        this.newOnDoChangeToOtherDocFormat = options.newOnDoChangeToOtherDocFormat || false;

        this.add = function () {
            var me = this;
            if (check(me, false)) {
                me.methodType = me.methodTypes.add;
                me.load();
            }
        }

        this.edit = function () {
            var me = this;
            if (check(me, true)) {
                me.methodType = me.methodTypes.edit;
                me.load();
            }
        }

        this.view = function () {
            var me = this;
            me.methodType = me.methodTypes.view;
            me.protectType = wpsApi.wpsProtectTypeEnum.read;
            me.load();
        }

        // 套红头和替换模板字段 isRed 是否是套红头
        this.redFile = function (url, redFileElement, customRedFileListUrl, customRedFileBaseUrl) {
            // 如果是true的话就是按套红头进行处理
            var me = this;
            if (url) {
                me.customRedFileUrl = url;
            }
            if (customRedFileListUrl) {
                me.customRedFileListUrl = customRedFileListUrl;
            }
            if (customRedFileBaseUrl) {
                me.customRedFileBaseUrl = customRedFileBaseUrl;
            }
            // 如果预先设置的有值则不变，如果没设置就预设值成默认
            if (!me.bkInsertFile) {
                me.bkInsertFile = "zhengwen"; // 可以使用默认设置进行处理
            }
            if (redFileElement) {
                me.redFileElement = redFileElement;
            }
            me.methodType = me.methodTypes.edit;
            me.load();
            //可能要清除redFileElement bkInsertFile
        }

        // 模板替换
        this.repFile = function (repFileElement, customRepJsonDataUrl) {
            var me = this;
            if (customRepJsonDataUrl) {
                me.customRepJsonDataUrl = customRepJsonDataUrl;
            }
            if (repFileElement) {
                me.repFileElement = repFileElement;
            }
            me.methodType = me.methodTypes.replace;
            me.load();
            //可能要清除repFileElement
        }

        //推出
        this.exit = function (isForce) {
            var me = this, info = {};
            me.methodType = me.methodTypes.exit;
            info.funcs = [{ExitWPS: {force: isForce || false}}]; // 默认不强制退出
            me.exec(info);
        }

        this.insertText = function (textObject) {
            var me = this, info = {};
            info.funcs = [{insertText: textObject}]; // 默认不强制退出
            me.exec(info);
        }

        this.customFunExe = function (fun, options) {
            var me = this, info = {};
            info.funcs = [{customFunctionExe: {fun: fun.toString(), options: options}}]; // 执行客户端自定义的方法
            me.exec(info);
        }

        this.getDocInfo = function () {
            var me = this, info = {};
            me.methodType = me.methodTypes.status;
            info.funcs = [{GetDocStatus: {}}];
            me.exec(info);
        }


        this.load = function () {
            var me = this, info = {};
            me = addToken(me);
            var params = {
                uploadPath: me.fileUploadPath.toString(), userName: me.userName,
                uploadFieldName: me.uploadFieldName, buttonGroups: me.buttonGroups,
                customExtend: me.customExtend, dispatcherPrefixFunction: me.dispatcherPrefixFunction.toString(),
                newOnDoChangeToOtherDocFormat: me.newOnDoChangeToOtherDocFormat, fileInsertObject: me.fileInsertObject,
                fileVersionPagePathUrl: me.fileVersionPagePathUrl,
            };
            // 打开关闭修订
            params.revisionCtrl = {bOpenRevision: me.openRevision, bShowRevision: me.openRevision};
            if (me.saveSuffix != null) {
                params.suffix = "." + me.saveSuffix;
                params.uploadWithAppendPath = 1;
            }
            //默认关闭的按钮组
            params.buttonGroups = me.buttonGroups;
            params.autoSaveToServer = me.autoSaveToServer;

            var type = me.methodType;
            params.methodType = type;

            if (me.customRedFileUrl != null) {
                params.customRedFileUrl = me.customRedFileUrl;
                params.bkInsertFile = me.bkInsertFile;
                params.redFileElement = me.redFileElement;
                //params.repFileElement = me.repFileElement;
            } else if (me.customRedFileListUrl != null) {
                params.customRedFileListUrl = me.customRedFileListUrl;
                params.customRedFileBaseUrl = me.customRedFileBaseUrl;
                params.bkInsertFile = me.bkInsertFile;
                params.redFileElement = me.redFileElement;
                //params.repFileElement = me.repFileElement;
            }

            // 新增
            if (type == me.methodTypes.add) {
                info.funcs = [{NewDoc: params}];
            } else {
                params.docId = me.docId;
                params.fileName = me.fileLoadPath.toString();
                if (me.protectType != null) {
                    params.openType = {protectType: me.protectType, password: me.password}
                }
                if (me.docPassword != null) {
                    params.docPassword = {docPassword: me.docPassword}
                }

                if (type == me.methodTypes.replace) {
                    params.repFileElement = me.repFileElement
                    params.customRepJsonDataUrl = me.customRepJsonDataUrl;
                    info.funcs = [{ReplaceDoc: params}];
                } else {
                    info.funcs = [{OpenDoc: params}];
                }
            }
            this.exec(info);
            // 执行创建一个消息通知回调
            if (me.saveCallback) {
                WpsInvoke.RegWebNotify(WpsInvoke.ClientType.wps, "WpsOAAssist", function (messageText) {
                    console.log("消息通知===>" + messageText);
                    return me.saveCallback(JSON.parse(decodeURI(messageText)));
                })
            }
        }

        this.exec = function (info) {
            var me = this, func = me.https ? WpsInvoke.InvokeAsHttps : WpsInvoke.InvokeAsHttp;
            //调用
            func(WpsInvoke.ClientType.wps, // 组件类型
                "WpsOAAssist", // 插件名，与wps客户端加载的加载的插件名对应
                "dispatcher", // 插件方法入口，与wps客户端加载的加载的插件代码对应，详细见插件代码
                info, // 传递给插件的数据
                function (result) { // 调用回调，status为0为成功，其他是错误
                    // 错误处理
                    if (result.status) {
                        if (result.status == 100) {
                            //WpsInvoke.AuthHttpesCert('请在稍后打开的网页中，点击"高级" => "继续前往"，完成授权。')
                            return;
                        }
                        alert(result.message)
                    } else {
                        console.log("回调函数打印:" + result.response)
                        if (me.openCallback) {
                            me.openCallback(result);
                        }
                        //showresult(result.response)
                    }
                })
        }
    }


    function et(options) {
        options.invoke = {
            type: WpsInvoke.ClientType.et, name: "EtOAAssist", dispatcher: "dispatcher",
        }
        return options;
    }

    function wpp(options) {
        options.invoke = {
            type: WpsInvoke.ClientType.wpp, name: "WppOAAssist", dispatcher: "dispatcher",
        }
        return options;
    }

    function Api(options) {
        this.fileLoadPath = options.fileLoadPath || ""; //文档加载地址
        this.docId = options.docId;  // 文档id
        this.fileUploadPath = options.fileUploadPath || ""; //文档保存上载地址
        this.userName = options.userName; //用户名
        // 按钮控制器 , 默认显示所以
        this.buttonGroups = options.buttonGroups || [wpsApi.defineEtButtonGroups.btnSaveAsFile, wpsApi.defineEtButtonGroups.btnSaveToServer].toString();

        this.add = function () {
            var me = this;
            if (check(me, false)) {
                me.load();
            }
        }

        this.edit = function () {
            var me = this;
            if (check(me, true)) {
                me.load();
            }
        }

        this.view = function () {
            var me = this;
            me.protectType = wpsApi.wpsProtectTypeEnum.read;
            me.buttonGroups = options.buttonGroups || [wpsApi.defineEtButtonGroups.btnSaveAsFile].toString();
            me.load();
        }

        this.load = function () {
            var me = this, info = {};
            me = addToken(me);
            var params = {
                buttonGroups: function button() {
                    var str = wpsApi.etAllButtonGroups();
                    var arr = me.buttonGroups.split(",");
                    for (var index in arr) {
                        str = str.replace(arr[index], "");
                    }
                    return str;
                }(),
                uploadPath: me.fileUploadPath.toString(),
                userName: me.userName,
            };
            params.docId = me.docId;
            params.fileName = me.fileLoadPath.toString();
            if (me.protectType != null) {
                params.openType = {protectType: me.protectType, password: me.password}
            }
            info.funcs = [{OpenDoc: params}];
            this.exec(info);
            // 执行创建一个消息通知回调 EtOAAssist  WppOAAssist
            // options
            if (me.saveCallback) {
                WpsInvoke.RegWebNotify(options.invoke.type, options.invoke.name, function (messageText) {
                    console.log("消息通知===>" + messageText);
                    return me.saveCallback(JSON.parse(decodeURI(messageText)));
                })
            }
        }

        this.exec = function (info) {
            var me = this, func = me.https ? WpsInvoke.InvokeAsHttps : WpsInvoke.InvokeAsHttp;
            //调用
            func(options.invoke.type, // 组件类型
                options.invoke.name, // 插件名，与wps客户端加载的加载的插件名对应
                options.invoke.dispatcher, // 插件方法入口，与wps客户端加载的加载的插件代码对应，详细见插件代码
                info, // 传递给插件的数据
                function (result) { // 调用回调，status为0为成功，其他是错误
                    // 错误处理
                    if (result.status) {
                        if (result.status == 100) {
                            return;
                        }
                        alert(result.message)
                    } else {
                        console.log("回调函数打印:" + result.response)
                        if (me.openCallback) {
                            me.openCallback(result);
                        }
                    }
                })
        }
    }

    // wps配置文件修改，设置publish.xml 。 如果有必要需要修改加载项配置，则执行
    function WpsPlugins(options) {
        if (options.type == WpsInvoke.ClientType.et) {
            options.name = "EtOAAssist";
        }
        if (options.type == WpsInvoke.ClientType.wpp) {
            options.name = "WppOAAssist";
        }
        this.online = !(options.offline || false);  // 在线离线 ，默认在线
        this.name = options.name || "WpsOAAssist"; // 插件名,
        this.type = options.type || "wps"; // wps类型
        this.url = options.url || ""; //加载url的地址
        this.cmd = options.cmd || "enable"; //"enable", 启用， "disable", 禁用, "disableall", 禁用所有
        this.callback = options.callback;
        // 更新wps加载项
        this.refresh = function () {
            var me = this;
            if (me.url == "" || me.url.lastIndexOf("/") != me.url.length - 1) {
                alert("参数url不能为空并且以/结尾!");
                return;
            }
            var data = formatData(me);

            WpsAddonGetAllConfig(function () {
                WpsInvoke.startWps({
                    url: "http://localhost:58890/deployaddons/runParams",
                    sendData: data,
                    callback: function (res) {
                        if (res.status == 0) {
                            console.log("配置成功");
                            me.callback(true, res);
                        } else {
                            console.log("wps加载项配置失败");
                            me.callback(false, res);
                        }
                    }
                });
            })
        }

        function formatData(wpsPlugins) {
            var data = {
                "cmd": wpsPlugins.cmd, //"enable", 启用， "disable", 禁用, "disableall", 禁用所有
                "name": wpsPlugins.name,
                "url": wpsPlugins.url,
                "addonType": wpsPlugins.type, //wps
                "online": wpsPlugins.online,
                "version": wpsPlugins.version // undefined
            }
            return FormatSendData(data);
        }


        function FormatSendData(data) {
            var strData = JSON.stringify(data);
            if (WpsInvoke.IEVersion() < 10)
                eval("strData = '" + JSON.stringify(strData) + "';");
            return WpsInvoke.encode(strData);
        }

        //先调用publishlist调起wps，唤起wpsoffice得端口
        function WpsAddonGetAllConfig(callBack) {
            var baseData;
            WpsInvoke.startWps({
                url: "http://127.0.0.1:58890/publishlist",
                type: "GET",
                sendData: baseData,
                callback: callBack,
                tryCount: 10,
                bPop: true,
                timeout: 5000,
                concurrent: false
            });
        }
    }


    window.wpsApi = {
        wps: function (options) {
            return new WpsApi(options);
        },
        et: function (options) {
            options = et(options)
            return new Api(options);
        },
        wpp: function (options) {
            options = wpp(options)
            return new Api(options);
        },
        //wps配置基本参数对象
        wpsPlugins: function (options) {
            return new WpsPlugins(options);
        },

        //返回wps的调用类型
        wpsType: function (fileType) {
            for (var key in fileOpenPlugin) {
                var type = fileOpenPlugin[key];
                for (var index in type) {
                    if (fileType == type[index]) {
                        return key;
                    }
                }
            }
        },

        wpsProtectTypeEnum: {
            disable: -1,  // 不启用保护模式
            onlyEditRevision: 0, //只允许对现有内容进行修订 , 修订内容可以保存，wps显示再右，office鼠标悬停显示
            onlyEditNotation: 1, // 只允许添加批注
            onlyEditWindow: 2, //只允许修改窗体域(禁止拷贝功能)
            read: 3, //只读
        },
        // 部分wps操作控制参数
        wpsInitParams: {
            AutoSaveToServer: false, //是否自动保存通过加载项加载的文件，默认不上传
        },

        // 可选按钮组
        defineWpsButtonGroups: {
            btnOpenWPSYUN: "btnOpenWPSYUN", //打开WPS云文档
            btnOpenLocalWPSYUN: "btnOpenLocalWPSYUN", // 导入文件
            btnSaveToServer: "btnSaveToServer", // 保存到OA服务器
            btnSaveAsFile: "btnSaveAsFile", // 保存本地
            btnChangeToPDF: "btnChangeToPDF", // 保存成pdf，一般用不到
            btnChangeToUOT: "btnChangeToUOT", // 转UOT上传，一般用不到
            btnChangeToOFD: "btnChangeToOFD", // 转OFD上传，一般用不到

            btnInsertRedHeader: "btnInsertRedHeader", // 套红头
            btnInsertSeal: "btnInsertSeal", // 印章
            btnUploadOABackup: "btnUploadOABackup", // 备份正文
            btnClearRevDoc: "btnClearRevDoc", // 清稿
            btnInsertBookmark: "btnInsertBookmark", // 导入书签
            btnImportTemplate: "btnImportTemplate", // 导入模板
            btnUndoFile: "btnUndoFile", // 撤销编辑
            btnFileVersion: "btnFileVersion", // 历史版本

            btnOpenRevision: "btnOpenRevision", // 打开修订
            btnCloseRevision: "btnCloseRevision", // 关闭修订
            btnAcceptAllRevisions: "btnAcceptAllRevisions", // 接收修订
            btnRejectAllRevisions: "btnRejectAllRevisions", // 拒绝修订

            btnInsertPic: "btnInsertPic", // 插入图片
            btnInsertDate: "btnInsertDate", // 插入日期
            btnPageSetup: "btnPageSetup", // 页面设置
            btnOpenScan: "btnOpenScan", // 打开扫描仪
            btnQRCode: "btnQRCode", // 二维码
            btnPrintDOC: "btnPrintDOC", // 打印设置
        },

        wpsDefaultCloseButtonGroups: function () {
            var bg = wpsApi.defineWpsButtonGroups;
            return [bg.btnOpenWPSYUN, bg.btnChangeToPDF, bg.btnChangeToUOT, bg.btnChangeToOFD,
                bg.btnInsertPic, bg.btnInsertDate, bg.btnQRCode, bg.btnInsertSeal, bg.btnUploadOABackup].toString();
        },

        wpsAllButtonGroups: function () {
            return wpsApi.allButtonGroups(wpsApi.defineWpsButtonGroups);
        },

        etAllButtonGroups: function () {
            return wpsApi.allButtonGroups(wpsApi.defineEtButtonGroups);
        },

        allButtonGroups: function (ButtonGroups) {
            var arr = [];
            for (var index in ButtonGroups) {
                arr.push(ButtonGroups[index]);
            }
            return arr.toString() + ",";
        },

        // et和wpp公用
        defineEtButtonGroups: {btnSaveToServer: "btnSaveToServer", btnSaveAsFile: "btnSaveAsFile"},

        wpsExtend: {
            isHttpUrl: function (url) {
                if (url == undefined || url == "" || (!url.startsWith("http:") && !url.startsWith("https:"))) {
                    return false;
                }
                return true;
            }
        }
    }

    /*$.fn.wpsApi = function (options) {
        return new WpsApi($(this), options);
    }*/
})
(window, document, jQuery)