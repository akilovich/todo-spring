package com.github.akilovich;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * The main class of the application.
 */

@SpringBootApplication
public class Application {
    private Application() {
    }

    /**
     * Starts the application.
     * @param args command line args
     */
    public static void main(final String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
