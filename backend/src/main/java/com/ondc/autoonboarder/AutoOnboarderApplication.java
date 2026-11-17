
package com.ondc.autoonboarder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class AutoOnboarderApplication {

    public static void main(String[] args) {
        SpringApplication.run(AutoOnboarderApplication.class, args);
    }
}
