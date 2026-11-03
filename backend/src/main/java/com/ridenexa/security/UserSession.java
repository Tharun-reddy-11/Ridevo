package com.ridenexa.security;

public record UserSession(String id, String email, String role, String fullName) {}
