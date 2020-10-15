/**
 * 在这个js中，集中处理来自OA的传入参数
 *
 */

/**
 * web页面调用WPS的方法入口
 *  * info参数结构
 * info:[
 *      {
 *       '方法名':'方法参数',需要执行的方法
 *     },
 *     ...
 *   ]
 * @param {*} info
 */
let testFuncs = null;

function dispatcher(info) {
    var funcs = info.funcs;
    // todo-5 修改每次操作完成之后的回调方式
    var message = {
        message: "success",
    };

    for (var index = 0; index < funcs.length; index++) {
        testFuncs = funcs;
        var func = funcs[index];
        for (var key in func) {
            // todo-12 , dispatcher启动前执行的方法
            if (func[key].dispatcherPrefixFunction && func[key].dispatcherPrefixFunction.startWith("function")) {
                exeFun(func[key].dispatcherPrefixFunction, key , func[key]);
            }
            if (key === "OpenDoc") { // OpenDoc 属于普通的打开文档的操作方式，文档落地操作
                OpenDoc(func[key]); //进入打开文档处理函数
            } else if (key === "OnlineEditDoc") { //在线方式打开文档，属于文档不落地的方式打开
                OnlineEditDoc(func[key]);
            } else if (key === "NewDoc") {
                OpenDoc(func[key]);
            } else if (key === "UseTemplate") {
                OpenDoc(func[key]);
            } else if (key === "InsertRedHead") {
                InsertRedHead(func[key]);
            } else if (key === "taskPaneBookMark") {
                taskPaneBookMark(func[key])
            } else if (key === "ExitWPS") {
                ExitWPS(func[key])
            } else if (key === "GetDocStatus") {
                message.info = GetDocStatus(func[key]);
            } else if (key === "NewOfficialDocument") {
                return OpenDoc(func[key])
            } else if (key == "openPdf") { // todo-8 添加打开pdf文件
                return openPdf(func[key])
            } else if (key == "ReplaceDoc") {
                return OpenDoc(func[key])
            }
            message.operation = key;

        }
    }
    //执行web页面传递的方法
    /*setTimeout(function(){

    },100)*/
    return message;
    //return {message:"ok", app:wps.WpsApplication().Name}
}


/**
 * 获取活动文档的状态
 */
function GetDocStatus() {
    let l_doc = wps.WpsApplication().ActiveDocument
    if (l_doc && pCheckIfOADoc()) {//此方法还可根据需要进行扩展
        return {
            message: "GetDocStatus",
            docstatus: {
                words: l_doc.Words.Count,
                saved: l_doc.Saved,
                pages: l_doc.ActiveWindow.Panes.Item(1).Pages.Count
            }
        }
    }
}

/**
 * 关闭WPS活动文档并退出WPS进程
 */
function ExitWPS(force) {
    let l_doc = wps.WpsApplication().ActiveDocument
    if (l_doc && pCheckIfOADoc()) {//此方法还可根据需要进行扩展
        l_doc.Close();
    }
    // todo-6 修改是否需要提示
    if (!force) {
        if (wps.confirm("要关闭WPS软件，请确认文档都已保存。\n点击确定后关闭WPS，点击取消继续编辑。")) {
            wps.WpsApplication().Quit();
        }
    } else {
        wps.WpsApplication().Quit();
    }
}

/**
 *
 * @param {*} params  OA端传入的参数
 */
function OnlineEditDoc(OaParams) {
    if (OaParams.fileName == "") {
        NewFile(OaParams);
    } else {
        //OA传来下载文件的URL地址，调用openFile 方法打开
        OpenOnLineFile(OaParams);
    }
}

///打开来自OA端传递来的文档
function OpenDoc(OaParams) {
    if (OaParams.fileName == "") {
        NewFile(OaParams);
    } else {
        //OA传来下载文件的URL地址，调用openFile 方法打开
        OpenFile(OaParams);
    }
}

function openPdf(OaParams) {
    var url = GetParamsValue(params, constStrEnum.notifyUrl);
    wps.WpsApplication().Documents.Open("");
}

function taskPaneBookMark(OaParams) {
    let filePath = OaParams.fileName
    if (filePath == "")
        return
    OpenFile(OaParams);

    //创建taskpane，只创建一次
    let id = wps.PluginStorage.getItem(constStrEnum.taskpaneid)
    if (id) {
        let tp = wps.GetTaskPane(id)
        tp.Width = 300
        tp.Visible = true
    } else {
        let url = getHtmlURL("taskpane.html");
        let tp = wps.CreateTaskPane(url, "书签操作")
        if (tp) {
            tp.DockPosition = WPS_Enum.msoCTPDockPositionRight  //这里可以设置taskapne是在左边还是右边
            tp.Width = 300
            tp.Visible = true
            wps.PluginStorage.setItem(constStrEnum.taskpaneid, tp.ID)
        }
    }
}