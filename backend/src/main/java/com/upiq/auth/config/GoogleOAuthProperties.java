package com.upiq.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "upiq.google")
public class GoogleOAuthProperties {
    private boolean enabled;
    private String clientId = "";
    private String clientSecret = "";
    private String frontendOrigin = "http://localhost:5173";
    private String redirectUri = "http://localhost:8080/login/oauth2/code/google";

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId == null ? "" : clientId.trim(); }
    public String getClientSecret() { return clientSecret; }
    public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret == null ? "" : clientSecret.trim(); }
    public String getFrontendOrigin() { return frontendOrigin; }
    public void setFrontendOrigin(String frontendOrigin) { this.frontendOrigin = frontendOrigin == null ? "" : frontendOrigin.trim(); }
    public String getRedirectUri() { return redirectUri; }
    public void setRedirectUri(String redirectUri) { this.redirectUri = redirectUri == null ? "" : redirectUri.trim(); }
}
