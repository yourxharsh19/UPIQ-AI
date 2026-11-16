package com.upiq.admin;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(AdminBootstrapProperties.class)
public class AdminBootstrapConfiguration {
    @Bean
    @ConditionalOnProperty(prefix = "upiq.admin.bootstrap", name = "enabled", havingValue = "true")
    ApplicationRunner initialAdminProvisioner(AdminBootstrapService service) {
        return args -> service.provisionInitialAdmin();
    }
}
