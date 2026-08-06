package com.folio.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "subjects")
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String code;
    private String colorHex;
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User user;

    private LocalDateTime createdAt;

    public Subject() {}

    public Subject(Long id, String name, String code, String colorHex, String description, User user, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.colorHex = colorHex;
        this.description = description;
        this.user = user;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static SubjectBuilder builder() {
        return new SubjectBuilder();
    }

    public static class SubjectBuilder {
        private Long id;
        private String name;
        private String code;
        private String colorHex;
        private String description;
        private User user;
        private LocalDateTime createdAt;

        public SubjectBuilder id(Long id) { this.id = id; return this; }
        public SubjectBuilder name(String name) { this.name = name; return this; }
        public SubjectBuilder code(String code) { this.code = code; return this; }
        public SubjectBuilder colorHex(String colorHex) { this.colorHex = colorHex; return this; }
        public SubjectBuilder description(String description) { this.description = description; return this; }
        public SubjectBuilder user(User user) { this.user = user; return this; }
        public SubjectBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Subject build() {
            return new Subject(id, name, code, colorHex, description, user, createdAt);
        }
    }
}
