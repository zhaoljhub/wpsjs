package com.example.wpsjs.controller;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.TypeReference;
import com.google.common.base.Joiner;
import com.vladsch.flexmark.Extension;
import com.vladsch.flexmark.ast.Node;
import com.vladsch.flexmark.ext.tables.TablesExtension;
import com.vladsch.flexmark.html.HtmlRenderer;
import com.vladsch.flexmark.parser.Parser;
import com.vladsch.flexmark.parser.ParserEmulationProfile;
import com.vladsch.flexmark.util.options.MutableDataSet;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.*;
import java.util.stream.Collectors;

/**
 * @author zhaolangjing
 * @Title: MdController
 * @ProjectName work
 * @Description: TODO
 * @date 2020-9-215:51
 */
@Controller
@RequestMapping("md")
public class MdController {
    @RequestMapping("/{mdName}")
    @ResponseBody
    public String md(@PathVariable String mdName) throws IOException {
        // 从文件中读取markdown内容
        InputStream stream = this.getClass().getClassLoader().getResourceAsStream( "md/" + mdName + ".md" );
        if (stream == null) {
            return "为找到";
        }
        BufferedReader reader = new BufferedReader( new InputStreamReader( stream, "utf-8" ) );
        List<String> list = reader.lines().collect( Collectors.toList() );
        String content = Joiner.on( "\n" ).join( list );
        // markdown to image
        MutableDataSet options = new MutableDataSet();
        options.setFrom( ParserEmulationProfile.MARKDOWN );
        options.set( Parser.EXTENSIONS, Arrays.asList( new Extension[]{TablesExtension.create()} ) );
        Parser parser = Parser.builder( options ).build();
        HtmlRenderer renderer = HtmlRenderer.builder( options ).build();

        Node document = parser.parse( content );
        String html = renderer.render( document );
        return html;
    }

    public static void main(String[] args) {
        //testOrg( new HashMap<>() );
        String str = "{\"CODE\":\"1\",\"CONTENT\":\"\",\"MESSAGE\":\"\",\"DATAS\":[{\"姓名\":\"测试待处理\",\"部门\":\"cs11\",\"身份证号\":\"510181199409172216\",\"岗位\":\"测试流程\",\"现专业技术职务\":\"测试111\",\"拟聘任专业技术职务\":\"测试111\",\"拟聘任专业技术职务资格取得时间\":\"\",\"拟聘任专业技术职务生效日期\":\"2020-09-17\"}]}";
        Map<String, String> stringStringMap = JSON.parseObject( str, new TypeReference<Map<String, String>>(){} );
        String datas = stringStringMap.get( "DATAS" );
        ArrayList<LinkedHashMap<String, String>> stringStringLinkedHashMap = JSON.parseObject( datas, new TypeReference<ArrayList<LinkedHashMap<String, String>>>(){} );
    }
}
