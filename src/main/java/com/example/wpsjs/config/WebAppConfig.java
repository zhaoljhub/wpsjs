package com.example.wpsjs.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


/**
 * 实现spring的基础配置
 * springboot实现继承得两种方式
 * 实现WebMvcConfigurer
 * 继承WebMvcConfigurationSupport
 * Description: <br/>
 * Copyright: 川大智胜系统集成公司 <br/>
 * Date: 2018年7月11日<br/>
 * Time: 下午2:36:11<br/>
 *
 * @author ZHAO.LANGJING
 * @version 1.0
 */
@Configuration
public class WebAppConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 添加直接暴露在外的访问路径。不需要springweb拦截的资源
        registry.addResourceHandler( "/static/**" ).addResourceLocations( "classpath:/static/" );
        // 把WpsOAAssist 直接暴露出去以便 wps加载项直接加载改目录下的文件
        registry.addResourceHandler( "/WpsOAAssist/**" ).addResourceLocations( "classpath:/WpsOAAssist/" );
        registry.addResourceHandler( "/EtOAAssist/**" ).addResourceLocations( "classpath:/EtOAAssist/" );
        registry.addResourceHandler( "/WppOAAssist/**" ).addResourceLocations( "classpath:/WppOAAssist/" );
    }
    /**
     * 配置拦截器
     * @author lance
     * @param registry
     *//*
    @Override
    public void addInterceptors(InterceptorRegistry registry) {  
	   	//  拦截配置/**才是拦截所有
        registry.addInterceptor(new GlobalParameterInterceptor()).addPathPatterns("/**");  
    }  */
}	
