package com.aicrm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class AiCrmApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiCrmApplication.class, args);
    }
}
