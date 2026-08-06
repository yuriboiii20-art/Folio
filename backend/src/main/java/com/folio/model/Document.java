package com.folio.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filename;

    private String originalName;
    private String contentType;
    private Long fileSize;
    private String storagePath;
    private String source;
    private boolean favorite;

    @Column(columnDefinition = "TEXT")
    private String extractedText;

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

    public Document() {}

    public Document(Long id, String filename, String originalName, String contentType, Long fileSize, String storagePath, String source, boolean favorite, String extractedText, Subject subject, User user, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.filename = filename;
        this.originalName = originalName;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.storagePath = storagePath;
        this.source = source;
        this.favorite = favorite;
        this.extractedText = extractedText;
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

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getOriginalName() { return originalName; }
    public void setOriginalName(String originalName) { this.originalName = originalName; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getStoragePath() { return storagePath; }
    public void setStoragePath(String storagePath) { this.storagePath = storagePath; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public boolean isFavorite() { return favorite; }
    public void setFavorite(boolean favorite) { this.favorite = favorite; }

    public String getExtractedText() { return extractedText; }
    public void setExtractedText(String extractedText) { this.extractedText = extractedText; }

    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static DocumentBuilder builder() {
        return new DocumentBuilder();
    }

    public static class DocumentBuilder {
        private Long id;
        private String filename;
        private String originalName;
        private String contentType;
        private Long fileSize;
        private String storagePath;
        private String source;
        private boolean favorite;
        private String extractedText;
        private Subject subject;
        private User user;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public DocumentBuilder id(Long id) { this.id = id; return this; }
        public DocumentBuilder filename(String filename) { this.filename = filename; return this; }
        public DocumentBuilder originalName(String originalName) { this.originalName = originalName; return this; }
        public DocumentBuilder contentType(String contentType) { this.contentType = contentType; return this; }
        public DocumentBuilder fileSize(Long fileSize) { this.fileSize = fileSize; return this; }
        public DocumentBuilder storagePath(String storagePath) { this.storagePath = storagePath; return this; }
        public DocumentBuilder source(String source) { this.source = source; return this; }
        public DocumentBuilder favorite(boolean favorite) { this.favorite = favorite; return this; }
        public DocumentBuilder extractedText(String extractedText) { this.extractedText = extractedText; return this; }
        public DocumentBuilder subject(Subject subject) { this.subject = subject; return this; }
        public DocumentBuilder user(User user) { this.user = user; return this; }
        public DocumentBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public DocumentBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Document build() {
            return new Document(id, filename, originalName, contentType, fileSize, storagePath, source, favorite, extractedText, subject, user, createdAt, updatedAt);
        }
    }
}
