package com.upiq.admin;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "upiq.admin.bootstrap")
public class AdminBootstrapProperties {
    private boolean enabled;
    private String email = "";
    private String password = "";

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email == null ? "" : email.trim(); }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password == null ? "" : password; }
}
