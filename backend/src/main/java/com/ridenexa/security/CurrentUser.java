package com.ridenexa.security;

import com.ridenexa.core.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {
    public UserSession require() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() == null ? null : SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserSession user) return user;
        throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in is required.");
    }
    public UserSession requireRole(String role) {
        UserSession user = require();
        if (!role.equals(user.role())) throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission for this action.");
        return user;
    }
}
