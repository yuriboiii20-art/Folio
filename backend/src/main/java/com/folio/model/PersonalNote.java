package com.folio.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "personal_notes")
public class PersonalNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "user"})
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User user;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PersonalNote() {}

    public PersonalNote(Long id, String title, String content, Subject subject, User user, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.subject = subject;
        this.user = user;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static PersonalNoteBuilder builder() {
        return new PersonalNoteBuilder();
    }

    public static class PersonalNoteBuilder {
        private Long id;
        private String title;
        private String content;
        private Subject subject;
        private User user;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public PersonalNoteBuilder id(Long id) { this.id = id; return this; }
        public PersonalNoteBuilder title(String title) { this.title = title; return this; }
        public PersonalNoteBuilder content(String content) { this.content = content; return this; }
        public PersonalNoteBuilder subject(Subject subject) { this.subject = subject; return this; }
        public PersonalNoteBuilder user(User user) { this.user = user; return this; }
        public PersonalNoteBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public PersonalNoteBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public PersonalNote build() {
            return new PersonalNote(id, title, content, subject, user, createdAt, updatedAt);
        }
    }
}
