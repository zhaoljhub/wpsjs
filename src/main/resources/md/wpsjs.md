#wpsjs说明文档

#### 资料文件
* 调起wps的执行文件
* 新的demo地址 https://zouyingfeng.coding.net/public/wps/wps/git/files/master 
* git的demo地址 ： git clone https://e.coding.net/zouyingfeng/wps.git  本地地址 F:\GIT\wps
* ps中执行以启动vscode能执行wpsjs的相关命令 ：set-executionpolicy remotesigned;
* 修改jsplugins.xml的目录  C:\Users\zhaolangjing\AppData\Roaming\kingsoft\wps\jsaddons
* 调起wps的方法文档 ： https://www.kdocs.cn/l/s60EEr2Kq
* 调起wps的方法的sdk ： F:\GIT\wps\oaassist\server\wwwroot\resource\js\wps_sdk.js
* node 原始镜像地址 ： https://registry.npmjs.org/ 
* wps加载项的比较全的文档 https://www.kdocs.cn/l/suMulkLGQ
* wps加载问题排查 ： https://www.kdocs.cn/view/l/cCVZwo3LW
* 新版wps下载地址 https://www.kdocs.cn/view/l/sGH09JXHo
* wps部署方案 https://www.kdocs.cn/view/l/crLuCxAmo
* md转html demo https://www.jianshu.com/p/cb21b4accdd9
* wps加载项文档首页 ： https://open.wps.cn/docs/office
* XMLHttpRequest讲解 https://segmentfault.com/a/1190000004322487 /https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/open

#### 修改jsplugins.xml的相关操作
    wps被调起的操作，首先通过oem.ini文件的JSPluginsServer的server配置获取jsplugins.xml写到本地，
    然后再通过jsplugins.xml的配置去获取对应的wps应用程序的加载项

#### 加载sdk
    
    
#### WpsOAAssist的文件直接暴露访问
    registry.addResourceHandler( "/WpsOAAssist/**" ).addResourceLocations( "classpath:/WpsOAAssist/" );
    需要将ResourceHandler配置成两个*号。不然一个*只会暴露一级目录下的文件，就很尴尬。照成加载wps加载项的时候报错。

#### 遇到的问题
    1.XMLHttpRequest，由于安全等问题，不能手动设置cookie等，所以验证信息只能由调用方手动拼接在上传和下载地址的后面，以参数的形式体现。
    2.在wps的58890端口未唤醒时，是不能执行publish写入的，先执行publishlist请求，可以唤醒58890端口
    
#### win下相关擦做命令
    1.netstat -aon|findstr "58890" //查看该端口详细信息
    2.tasklist|findstr "22024"  // 查看58890端口多对应得pid对应得进程程序是哪个
    
#### 代码心得
    1.getVisible="OnGetVisible"  // 配置指定需要的是否显示按钮的js执行方法。
    2.wps.ribbonUI.ActivateTab("WPSWorkExtTab")  跳转到目标按钮tab页签上面去