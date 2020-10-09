package com.example.wpsjs;

import org.ini4j.Wini;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;

@Component
public class CommandRunner implements CommandLineRunner, ApplicationContextAware {
    @Value("http://127.0.0.1:8080/wpsJs/index")
    private String url;

    @Value("http://127.0.0.1:8080/static/jsplugins.xml")
    private String JSPluginsServer;

    private ApplicationContext applicationContext;

    private boolean isWin;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }

    @Override
    public void run(String... args) throws Exception {
        Environment environment = applicationContext.getEnvironment();
        String os = environment.getProperty( "os" );
        isWin = os != null && os.startsWith( "Win" );
        //changeOem(  );
        //restartWps(  );
        openExplorer();
        System.out.println( " 执行成功 ，打开目录地址 ：" + url );
    }


    public boolean changeOem() {
        try {
            String oemPath = null;
            if (isWin) {
                //查询文件地址
                Runtime run = Runtime.getRuntime();
                String cmd = "REG QUERY HKEY_CLASSES_ROOT\\KWPS.Document.12\\shell\\open\\command /ve";
                //测试
                Process exec = run.exec( cmd );
                InputStream is = exec.getInputStream();
                BufferedReader reader = new BufferedReader( new InputStreamReader( is ) );
                String std = "";
                String line;
                while ((line = reader.readLine()) != null) {
                    std += line;
                }
                exec.waitFor();
                is.close();
                reader.close();
                exec.destroy();

                if (std != "") {
                    //path = D:\Program Files (x86)\Kingsoft\WPS Office\11.8.2.8808\office6\wps.exe
                    String path = std.split( "    " )[3].split( "\"" )[1];
                    File file = new File( path );
                    if (!file.exists()) {
                        throw new Exception( "WSP安装异常，请确认有没有正确的安装WPS2019" );
                    }
                    oemPath = path.replace( "wps.exe", "" ) + "\\cfgs\\oem.ini";
                }
            } else {
                oemPath = "/opt/kingsoft/wps-office/office6/cfgs/oem.ini";
            }
            if (oemPath != null) {
                Wini wini = new Wini( new File( oemPath ) );
                String result = wini.put( "Server", "JSPluginsServer", JSPluginsServer );
                wini.store();
                System.out.println( "执行初始化oem.ini的JSPluginsServer更新成功===>" + result + "     path:" + oemPath );
            } else {
                throw new Exception( "未找到正确配置" );
            }
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
        return true;
    }

    public void openExplorer() {
        String cmd = "explorer" + " " + url;
        Runtime run = Runtime.getRuntime();
        try {
            //测试
            if (isWin) {
                run.exec( cmd );
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void restartWps() {
        if (!isWin) {
            try {
                Runtime run = Runtime.getRuntime();
                run.exec( "quickstartoffice restart" );
                System.out.println( "成功执行 quickstartoffice restart 重启wps。" );
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
