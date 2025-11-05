package com.sage.engine.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/debug")
public class DebugController {
    
    private static final Logger logger = LoggerFactory.getLogger(DebugController.class);

    @GetMapping("/auth")
    public Map<String, Object> getAuthInfo() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> info = new HashMap<>();
        
        if (auth != null) {
            info.put("name", auth.getName());
            info.put("authorities", auth.getAuthorities());
            info.put("authenticated", auth.isAuthenticated());
            info.put("details", auth.getDetails());
            
            logger.info("Auth Debug - User: {}, Authorities: {}, Authenticated: {}", 
                auth.getName(), 
                auth.getAuthorities(), 
                auth.isAuthenticated());
        } else {
            info.put("error", "No authentication found");
            logger.warn("Auth Debug - No authentication found in context");
        }
        
        return info;
    }
}