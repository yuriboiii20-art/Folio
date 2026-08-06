package com.folio.dto;

import com.folio.model.User;

public class AuthDto {

    public static class LoginRequest {
        private String email;
        private String password;

        public LoginRequest() {}
        public LoginRequest(String email, String password) {
            this.email = email;
            this.password = password;
        }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        private String fullName;
        private String email;
        private String password;

        public RegisterRequest() {}
        public RegisterRequest(String fullName, String email, String password) {
            this.fullName = fullName;
            this.email = email;
            this.password = password;
        }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class AuthResponse {
        private String token;
        private Long userId;
        private String email;
        private String fullName;
        private User.Role role;

        public AuthResponse() {}
        public AuthResponse(String token, Long userId, String email, String fullName, User.Role role) {
            this.token = token;
            this.userId = userId;
            this.email = email;
            this.fullName = fullName;
            this.role = role;
        }

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public User.Role getRole() { return role; }
        public void setRole(User.Role role) { this.role = role; }

        public static AuthResponseBuilder builder() {
            return new AuthResponseBuilder();
        }

        public static class AuthResponseBuilder {
            private String token;
            private Long userId;
            private String email;
            private String fullName;
            private User.Role role;

            public AuthResponseBuilder token(String token) { this.token = token; return this; }
            public AuthResponseBuilder userId(Long userId) { this.userId = userId; return this; }
            public AuthResponseBuilder email(String email) { this.email = email; return this; }
            public AuthResponseBuilder fullName(String fullName) { this.fullName = fullName; return this; }
            public AuthResponseBuilder role(User.Role role) { this.role = role; return this; }

            public AuthResponse build() {
                return new AuthResponse(token, userId, email, fullName, role);
            }
        }
    }
}
