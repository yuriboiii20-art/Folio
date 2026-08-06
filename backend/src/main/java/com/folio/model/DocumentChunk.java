package com.folio.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "document_chunks")
public class DocumentChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "subject", "user"})
    private Document document;

    private Integer chunkIndex;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String chunkText;

    @Column(columnDefinition = "TEXT")
    private String embeddingVector;

    public DocumentChunk() {}

    public DocumentChunk(Long id, Document document, Integer chunkIndex, String chunkText, String embeddingVector) {
        this.id = id;
        this.document = document;
        this.chunkIndex = chunkIndex;
        this.chunkText = chunkText;
        this.embeddingVector = embeddingVector;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Document getDocument() { return document; }
    public void setDocument(Document document) { this.document = document; }

    public Integer getChunkIndex() { return chunkIndex; }
    public void setChunkIndex(Integer chunkIndex) { this.chunkIndex = chunkIndex; }

    public String getChunkText() { return chunkText; }
    public void setChunkText(String chunkText) { this.chunkText = chunkText; }

    public String getEmbeddingVector() { return embeddingVector; }
    public void setEmbeddingVector(String embeddingVector) { this.embeddingVector = embeddingVector; }

    public static DocumentChunkBuilder builder() {
        return new DocumentChunkBuilder();
    }

    public static class DocumentChunkBuilder {
        private Long id;
        private Document document;
        private Integer chunkIndex;
        private String chunkText;
        private String embeddingVector;

        public DocumentChunkBuilder id(Long id) { this.id = id; return this; }
        public DocumentChunkBuilder document(Document document) { this.document = document; return this; }
        public DocumentChunkBuilder chunkIndex(Integer chunkIndex) { this.chunkIndex = chunkIndex; return this; }
        public DocumentChunkBuilder chunkText(String chunkText) { this.chunkText = chunkText; return this; }
        public DocumentChunkBuilder embeddingVector(String embeddingVector) { this.embeddingVector = embeddingVector; return this; }

        public DocumentChunk build() {
            return new DocumentChunk(id, document, chunkIndex, chunkText, embeddingVector);
        }
    }
}
