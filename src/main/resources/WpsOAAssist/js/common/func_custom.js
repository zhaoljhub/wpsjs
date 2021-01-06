/**
 * 转字符串
 * @param info
 */
function notifyMessage(info, state) {
    return encodeURI(JSON.stringify({
        state: state || true ? "success" : "error",
        info: info,
    }))
}


// 直接套红和套模板方法
function customWpsRedFile(doc) {
    if (!doc) {
        alert('文档不存在!');
        return;
    }

    var bookmark = GetDocParamsValue(doc, constStrEnum.bkInsertFile);
    // ，没有正文标签就是套模板
    if (bookmark == "") {
        alert("没有正文标签！");
    } else {
        // 套红
        var strFile = GetDocParamsValue(doc, constStrEnum.customRedFileUrl);
        if (strFile == "") {
            alert("未获取到系统传入的红头模板URL路径，不能正常套红");
            return;
        }
        customInsertRedFile(doc, strFile, bookmark)
    }
}

// 套红头 [标题]
function customInsertRedFile(doc, strFile, bookmark) {
    var bookMarks = doc.Bookmarks;
    if (bookMarks.Item("quanwen")) { // 当前文档存在"quanwen"书签时候表示已经套过红头
        alert("当前文档已套过红头，请勿重复操作!");
        return;
    }
    var wpsApp = wps.WpsApplication();
    var activeDoc = wpsApp.ActiveDocument;
    var selection = wpsApp.ActiveWindow.Selection;
    // 准备以非批注的模式插入红头文件(剪切/粘贴等操作会留有痕迹,故先关闭修订)
    activeDoc.TrackRevisions = false;
    selection.WholeStory(); //选取全文
    bookMarks.Add("quanwen", selection.Range)
    selection.Cut();
    selection.InsertFile(strFile);
    var success = false;
    if (bookMarks.Exists(bookmark)) {
        var bookmark1 = bookMarks.Item(bookmark);
        bookmark1.Range.Select(); //获取指定书签位置
        var s = activeDoc.ActiveWindow.Selection;
        s.Paste();
        success = true;
    } else {
        if (bookmark == "zhengwen") {
            bookmark = "[正文]";
        }
        if (bookmark.startsWith("[")) {
            //replaceText(bookmark, activeDoc.ActiveWindow.Selection.Paste());
            activeDoc.ActiveWindow.Selection.Find.Execute(
                bookmark, false, false, false, false, false, true, 1, true,
                "^c", 2);
            success = true;
        }
    }
    if (!success) {
        alert("套红头失败，您选择的红头模板没有对应书签：" + bookmark);
    }
    // 轮询插入书签
    var elements = GetDocParamsValue(doc, constStrEnum.redFileElement);
    if (elements != "") {
        for (var key in elements) {
            console.log(key + "----" + elements[key])
            if (key.startsWith("[")) {
                replaceText(key, elements[key]);
            } else if (bookMarks.Exists(key)) {
                // 直接插入
                var eleBookmark = bookMarks.Item(key);
                eleBookmark.Range.Text = elements[key];
            }
        }
        wps.WpsApplication().ActiveDocument.ActiveWindow.Selection.HomeKey(6)
    }
    // 恢复修订模式(根据传入参数决定)
    var l_revisionCtrl = GetDocParamsValue(activeDoc, constStrEnum.revisionCtrl);
    activeDoc.TrackRevisions = l_revisionCtrl == "" ? false : l_revisionCtrl.bOpenRevision;
    //取消WPS关闭时的提示信息
    wps.WpsApplication().DisplayAlerts = WPS_Enum.wdAlertsNone;
}

// 套模板
function customInsertRepFile(doc) {
    var window = wps.WpsApplication().ActiveDocument.ActiveWindow;
    window.Selection.HomeKey(6); //跳转到文档开头
    var repJson = GetDocParamsValue(doc, constStrEnum.repFileElement);
    var customRepJsonDataUrl = GetDocParamsValue(doc, constStrEnum.customRepJsonDataUrl);
    if (repJson) {
        new Replace(repJson).start();
    } else if (isHttpUrl(customRepJsonDataUrl)) {
        $.post(customRepJsonDataUrl, function (data) {
            if (data) {
                new Replace(JSON.parse(data)).start();
            }
        })
    }
}


function replaceText(strOldText, strNewText) {
    //首先清除任何现有的格式设置选项，然后设置搜索字符串 strOldText。
    /*doc.Selection.Find.ClearFormatting();
    doc.Application.Selection.Find.Text = strOldText;
    doc.Selection.Find.Replacement
        .ClearFormatting();
    doc.Selection.Find.Replacement.Text = strNewText;*/
    // 直接替换字段
    var window = wps.WpsApplication().ActiveDocument.ActiveWindow;
    window.Selection.WholeStory(); //选取全文
    return window.Selection.Find.Execute(
        strOldText, false, false, false, false, false, true, 1, true,
        strNewText, 2);
    // TANGER_OCX_OBJ.Sections(1).Headers(1).Range.Text.Selection.Find.Execute(strOldText, false, false, false, false, false, true, 1, true, strNewText, 2);
}


function Replace(jsonData) {
    this.JsonData = jsonData || null;
    this.docWindow = wps.WpsApplication().ActiveDocument.ActiveWindow;
    this.se = null; // 当前执行操作得selection得对象
    this.startHome = function () {
        this.docWindow.Selection.HomeKey(6);
        this.se = this.docWindow.Selection;
    }

    // 查找文档关键字
    this.findKey = function (key) {
        var me = this;
        me.startHome(); //归位
        me.se.Find.ClearFormatting(); // 消除查找替换中得字符限制
        me.se.Find.Replacement.ClearFormatting();  // 消除查找替换中得字符限制
        me.se.Find.Text = key;
        if (!me.se.Find.Execute()) {
            me.se = null;
        }
    }

    this.type1 = function (cell) {
        var me = this;
        me.findKey(cell.keyName);
        if (me.se) {
            if (isEmpty(cell.keyValue)) {
                me.se.TypeText(" ");
            } else {
                me.se.TypeText(cell.keyValue);
            }
        }
    }

    this.type2 = function (cell) {
        var me = this;
        me.findKey(cell.keyName);
        if (me.se) {
            var cellValue = JSON.parse(cell.keyValue);
            var pictureArr = [];
            for (var index2 in cellValue) {
                var scell = cellValue[index2];
                scell.keyText = scell.keyText || "";
                scell.keyValue = scell.keyValue || "";
                scell.userName = scell.userName || "";
                scell.keyDate = scell.keyDate || "";
                scell.userPicUrl = scell.userPicUrl || "";
                var text = scell.keyText + scell.keyValue;
                var user = "";
                if (isHttpUrl(scell.keyValue)) {
                    var key = "[picture-text" + index2 + "]";
                    var value = scell.keyValue;

                    text = scell.keyText + " " + key;
                    pictureArr.push({key: key, value: value});
                }
                if (scell.userName != "") {
                    user = scell.userName;
                }
                if (scell.userPicUrl != "" && isHttpUrl(scell.userPicUrl)) {
                    var key = "[picture-user" + index2 + "]";
                    var value = scell.userPicUrl;
                    user = key;
                    pictureArr.push({key: key, value: value});
                }
                if (scell.keyDate != "") {
                    user += "   " + scell.keyDate;
                }

                if (text != null && text != "") {
                    me.se.ParagraphFormat.Alignment = 0; //设置当前行段落靠左对齐 WdParagraphAlignment.wdAlignParagraphLeft
                    me.se.TypeText(text);
                    if (user != "") {
                        me.se.TypeParagraph(); //新增一行
                        me.se.ParagraphFormat.Alignment = 2 // 靠右对齐
                        me.se.TypeText(user);
                    }
                    me.se.TypeParagraph(); //新增一行
                }
            }
            //处理图片 , 因为wps得大图片
            this.addPicture(pictureArr);
        }
    }

    this.addPicture = function (pictureArr) {
        if (pictureArr.length > 0) {
            pictureArr.forEach(o => {
                DownloadFile(o.value, function (path) {
                    if (path == "") {
                        console.log("从服务端下载路径：" + o.value + "\n" + "获取图片下载失败！");
                        return;
                    }
                    console.log("图片缓存路径" + path);
                    // wps下图片超过20k，用url加载就会有问题。这里只能通过先将图片下载到本地然后再进去处理的方式了。
                    var me = new Replace();
                    me.findKey(o.key);
                    var InlineShape = me.se.InlineShapes.AddPicture(path, false, true, me.se.Range);
                    if (InlineShape) {
                        if (o.key.indexOf("text") > -1) {
                            InlineShape.Height = 130;//自己调整下哪个高宽适合
                            InlineShape.Width = 70;
                        } else if (o.key.indexOf("user") > -1) {
                            InlineShape.Height = 50;//自己调整下哪个高宽适合
                            InlineShape.Width = 95;
                        }
                    }
                    // 删除缓存图片
                    wps.FileSystem.Remove(path);
                    me.startHome(); //因为异步加载文件，所以这里处理一下，定位到开始
                });
            });
        }
    }

    this.start = function () {
        var me = this;
        if (me.JsonData != null) {
            for (var index in me.JsonData) {
                var cell = me.JsonData[index];
                if (!cell.keyName.startsWith("[")) {
                    cell.keyName = "[" + cell.keyName + "]";
                }
                if (cell.keyType == 1) {
                    me.type1(cell);
                }
                if (cell.keyType == 2) {
                    me.type2(cell);
                }
            }
            me.startHome(); //定位到开始
        }
    }

}

// 撤销编辑
function undoFile() {
    // 发送消息表示吃撤回文件，然后关闭文件，客户端重新加载
    var document = wps.WpsApplication().ActiveDocument;
    var info = {
        serverResponse: "success",
        wpsInfo: wps.PluginStorage.getItem(document.DocID),
        event: "undoFile",
    };
    if (wps.confirm("是否撤销正在编辑的文件？撤销将重新加载文件！") == true) {
        document.Saved = true;
        document.Close(-1);
        wps.OAAssist.WebNotify(notifyMessage(info));
    }
}

// 打开历史版本页面
function fileVersion() {
    var l_Doc = wps.WpsApplication().ActiveDocument;
    if (!l_Doc) {
        return;
    }
    // 需要自己去实现页面
    var l_insertFileUrl = GetDocParamsValue(l_Doc, constStrEnum.fileVersionPagePathUrl); //插入文件的位置
    if (l_insertFileUrl != "") {
        var height = 1000;
        var width = 600;
        OnShowDialog(l_insertFileUrl, "历史版本", height, width);
        return;
    } else {
        alert("参数fileVersionPagePathUrl为空！");
        return;
    }
}

// 在当前的文档光标处插入文本
function insertText(params) {
    var se = wps.WpsApplication().ActiveDocument.ActiveWindow.Selection;
    se.InsertAfter(params.text);
    if (params.color) {
        se.Font.Color = params.color;
    }
    if (params.size) {
        se.Font.Size = params.size;
    }
    if (params.name) {
        se.Font.Name = params.name;
    }
    se.EndKey();
}

function customFunctionExe(fun, options) {
    var funStr = "return " + fun;
    var jsCode = new Function(funStr())();
    return jsCode(options);
}