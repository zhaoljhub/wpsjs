package com.example.wpsjs;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WpsjsApplication {

    /**
     * http://127.0.0.1:8081/wpsJs/test
     * http://127.0.0.1:8081/wpsJs/index
     *
     * JSPluginsServer=http://127.0.0.1:8081/static/jsplugins.xml
     * JSPluginsServer=http://127.0.0.1:3888/jsplugins.xml
     *
     * @param args
     */
    public static void main(String[] args) {
        SpringApplication.run( WpsjsApplication.class, args );
    }

}
