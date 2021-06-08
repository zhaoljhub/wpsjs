package com.example.wpsjs.controller;

import com.alibaba.fastjson.JSON;
import com.example.wpsjs.CommandRunner;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author zhaolangjing
 * @Title: WpsJsController
 * @ProjectName work
 * @Description: TODO
 * @date 2020-8-2014:04
 */
@Controller
@RequestMapping("wpsJs")
public class WpsJsController {


    @Autowired
    private CommandRunner commandRunner;

    @RequestMapping("test")
    @ResponseBody
    public String test() {
        return "success";
    }

    @GetMapping("index")
    public String index() {
        return "index";
    }




    @RequestMapping("page/{pages}")
    public String index(@PathVariable String pages) {
        if (pages != null) {
            return pages;
        }
        return "index";
    }


    @RequestMapping("setCookie")
    public String setCookie(HttpServletResponse response) {
        System.out.println("test cookie");
        Cookie cookie = new Cookie("token", "123345");
        response.addCookie(cookie);
        return "setCookie";
    }

    @RequestMapping("refresh")
    @ResponseBody
    public String refreshXml() {
        boolean b = commandRunner.changeOem();
        commandRunner.restartWps();
        return (b ? "更新成功" : "更新失败") + "，详细信息请看后台控制台输出日志";
    }

    @RequestMapping("getFile/{fileName}")
    public void getFile(HttpServletRequest request, HttpServletResponse response, @PathVariable String fileName) throws IOException {
        InputStream is = null;
        //File file = new File( "E:2.资料2.公司资料公文常见问题记录.docx" );
        if (fileName != null && fileName != "") {
            is = WpsJsController.class.getClassLoader().getResourceAsStream(fileName);
        } else {
            is = WpsJsController.class.getClassLoader().getResourceAsStream("test.docx");
        }
        System.out.println(is.getClass().getName());
        response.setCharacterEncoding("utf-8");
        response.setContentType("multipart/form-data");
        // 重要，如果不对文件名称进行转码的话，wps再加载乱码的文件时会出问题。
        // 将文件名进行一个中文编码处理，不然wps识别不了 和浏览器的文件下载不太一样。
        fileName = URLEncoder.encode(fileName, "UTF-8");
        response.setHeader("Content-disposition", "attachment; filename=" + fileName);
        ServletOutputStream outputStream = response.getOutputStream();

        int allByte = 0;
        byte[] buff = new byte[2048];
        int bytesRead;
        while (-1 != (bytesRead = is.read(buff, 0, buff.length))) {
            outputStream.write(buff, 0, bytesRead);
            allByte += bytesRead;
        }
        // 为什么不能用is.available()获取文件的大小呢 ，是因为当文件打包成jar后，文件流获取对象变为
        // org.springframework.boot.loader.data.RandomAccessDataFile$DataInputStream，在DataInputStream直接继承InputStream
        // InputStream.available()这个默认方法是直接返回的0，所以照成浏览器解析时直接以文件大小为0进行解析的。故不能用is.available()直接获取文件大小
        //response.setHeader( "Content-Length", String.valueOf( allByte ) );
        System.out.println("文件大小" + allByte);
        is.close();
        outputStream.close();
    }


    @RequestMapping("saveFile/{filePath}")
    @ResponseBody
    public String getFile(MultipartHttpServletRequest request, @PathVariable String filePath) throws IOException {

        //查看cookie
        Cookie[] cookies = request.getCookies();
        System.out.println("cookies===>" + JSON.toJSONString(cookies));

        String fileName = File.separator + filePath;
        MultiValueMap<String, MultipartFile> filesMap = request.getMultiFileMap();
        for (String key : filesMap.keySet()) {
            String originalFilename = filesMap.get(key).get(0).getOriginalFilename();
            System.out.println("开始保存文件===>" + originalFilename);
            fileName = fileName + "." + originalFilename.split("\\.")[1];
            File file = new File(fileName);

            InputStream inputStream = filesMap.get(key).get(0).getInputStream();
            FileOutputStream fileOutputStream = new FileOutputStream(file);
            byte[] buff = new byte[2048];
            int bytesRead;
            while (-1 != (bytesRead = inputStream.read(buff, 0, buff.length))) {
                fileOutputStream.write(buff, 0, bytesRead);
            }
            inputStream.close();
            fileOutputStream.close();
            System.out.println("文件保存成功，保存地址为：" + file.getAbsolutePath());
            return "文件保存成功，保存地址为：" + file.getAbsolutePath();
        }
        return null;
    }


    @RequestMapping("getRedList")
    @ResponseBody
    public String getTepList(String search) {
        List<Map<String, String>> map = new ArrayList<>();
        Map<String, String> map1 = new HashMap();
        map1.put("id", "红头文件.docx");
        map1.put("name", "红头文件.docx");
        map1.put("url", "http://127.0.0.1:8081/wpsJs/getFile/红头文件.docx");

        Map<String, String> map2 = new HashMap();
        map2.put("id", "红头文件1.docx");
        map2.put("name", "红头文件1.docx");
        map2.put("url", "http://127.0.0.1:8081/wpsJs/getFile/红头文件1.docx");

        if (search != null && search != "" && "红头文件.docx".contains(search)) {
            map.add(map1);
        } else if (search != null && search != "" && "红头文件1.docx".contains(search)) {
            map.add(map2);
        } else {
            map.add(map1);
            map.add(map2);
        }
        return JSON.toJSONString(map);
    }


    @RequestMapping("getRepJson")
    @ResponseBody
    public String getRepJson() {
        ArrayList<Map<String, Object>> objects = new ArrayList<>();

        Map<String, Object> map = new HashMap<>();
        map.put("keyName", "标题");
        map.put("keyValue", "测试公文标题");
        map.put("keyType", 1);

        HashMap<String, Object> map3 = new HashMap<>();
        map3.put("keyName", "主送");
        map3.put("keyValue", "测试主送啊啊啊的");
        map3.put("keyType", 1);

        HashMap<String, Object> map2 = new HashMap<>();
        map2.put("keyName", "流程意见");
        map2.put("keyValue", "[{\"keyText\":\"1、\",\"keyValue\":\"请xxx批示意见可以长一点，意见可以长一点，意见可以长一点，意见可以长一点，意见可以长一点，\",\"userName\":\"张三\",\"userPicUrl\":null,\"keyDate\":\"2019年8月12日\",\"userPicSize\":0,\"fontSize\":0}," +
                "{\"keyText\":\"2、\",\"keyValue\":\"请xxx指示,意见可以长一点，\",\"userName\":\"李四\",\"userPicUrl\":null,\"keyDate\":\"2019-8-12 14:20:24\",\"userPicSize\":0,\"fontSize\":0}," +
                "{\"keyText\":\"3、\",\"keyValue\":\"http://127.0.0.1:8081/WpsOAAssist/icon/c_bookmark.png\",\"userName\":\"尼古拉-赵四\",\"userPicUrl\":null,\"keyDate\":\"2019年8月12日 14:20:24\",\"userPicSize\":0,\"fontSize\":0}," +
                "{\"keyText\":\"4、\",\"keyValue\":\"请xxx批复一下,意见可以长一点，意见可以长一点，意见可以长一点，意见可以长一点，\",\"userName\":\"杰神\",\"userPicUrl\":null,\"keyDate\":\"2019年8月12日 14:20:24\",\"userPicSize\":0,\"fontSize\":0}," +
                "{\"keyText\":\"5、\",\"keyValue\":\"http://127.0.0.1:8081/WpsOAAssist/icon/c_bookmark.png\",\"userName\":\"王五\",\"userPicUrl\":\"http://127.0.0.1:8081/WpsOAAssist/icon/c_bookmark.png\",\"keyDate\":\"2019年8月12日 14:20:24\",\"userPicSize\":0,\"fontSize\":0}]");
        map2.put("keyType", 2);

        HashMap<String, Object> map4 = new HashMap<>();
        map4.put("keyName", "流程意见2");
        map4.put("keyValue", "[{\"keyText\":\"1、\",\"keyValue\":\"请xxx批示\",\"userName\":\"张三\",\"userPicUrl\":null,\"keyDate\":\"\",\"userPicSize\":0,\"fontSize\":0}," +
                "{\"keyText\":\"2、\",\"keyValue\":\"请xxx指示\",\"userName\":\"李四\",\"userPicUrl\":null,\"keyDate\":\"\",\"userPicSize\":0,\"fontSize\":0}," +
                "{\"keyText\":\"3、\",\"keyValue\":\"http://127.0.0.1:8081/static/picture/test.jpg\",\"userName\":\"王五\",\"userPicUrl\":null,\"keyDate\":\"\",\"userPicSize\":0,\"fontSize\":0}]");
        map4.put("keyType", 2);
        objects.add(map);
        objects.add(map2);
        objects.add(map4);
        objects.add(map3);
        return JSON.toJSONString(objects);
    }
}
