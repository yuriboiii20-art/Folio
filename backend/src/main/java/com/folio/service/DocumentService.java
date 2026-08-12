package com.folio.service;

import com.folio.model.Document;
import com.folio.model.DocumentChunk;
import com.folio.model.Subject;
import com.folio.model.User;
import com.folio.repository.DocumentChunkRepository;
import com.folio.repository.DocumentRepository;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class DocumentService {

    @Value("${folio.storage.location:./uploads}")
    private String uploadDir;

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final Tika tika = new Tika();

    public DocumentService(DocumentRepository documentRepository, DocumentChunkRepository documentChunkRepository) {
        this.documentRepository = documentRepository;
        this.documentChunkRepository = documentChunkRepository;
    }

    public Document uploadDocument(MultipartFile file, Subject subject, User user, String source) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String storedFilename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(storedFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        String extractedText = "";
        try {
            extractedText = tika.parseToString(filePath.toFile());
        } catch (Exception e) {
            extractedText = "Unable to extract text: " + e.getMessage();
        }

        Document document = Document.builder()
                .filename(file.getOriginalFilename())
                .originalName(file.getOriginalFilename())
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .storagePath(filePath.toString())
                .source(source != null ? source : "UPLOAD")
                .favorite(false)
                .extractedText(extractedText)
                .subject(subject)
                .user(user)
                .build();

        Document savedDocument = documentRepository.save(document);
        chunkAndSaveDocument(savedDocument, extractedText);

        return savedDocument;
    }

    private void chunkAndSaveDocument(Document document, String text) {
        if (text == null || text.isBlank()) return;
        
        int chunkSize = 500;
        int index = 0;
        for (int i = 0; i < text.length(); i += chunkSize) {
            int end = Math.min(text.length(), i + chunkSize);
            String chunkStr = text.substring(i, end);

            DocumentChunk chunk = DocumentChunk.builder()
                    .document(document)
                    .chunkIndex(index++)
                    .chunkText(chunkStr)
                    .build();
            documentChunkRepository.save(chunk);
        }
    }

    public List<Document> getUserDocuments(Long userId) {
        return documentRepository.findByUserIdAndTrashedFalse(userId);
    }

    public List<Document> getSubjectDocuments(Long subjectId) {
        return documentRepository.findBySubjectIdAndTrashedFalse(subjectId);
    }

    public List<Document> searchKeyword(Long userId, String query) {
        return documentRepository.searchKeyword(userId, query);
    }

    public List<Document> getTrashedDocuments(Long userId) {
        return documentRepository.findByUserIdAndTrashedTrue(userId);
    }

    public void softDeleteDocument(Long documentId) {
        documentRepository.findById(documentId).ifPresent(doc -> {
            doc.setTrashed(true);
            doc.setTrashedAt(LocalDateTime.now());
            documentRepository.save(doc);
        });
    }

    public void restoreDocument(Long documentId) {
        documentRepository.findById(documentId).ifPresent(doc -> {
            doc.setTrashed(false);
            doc.setTrashedAt(null);
            documentRepository.save(doc);
        });
    }

    public void permanentlyDeleteDocument(Long documentId) {
        documentRepository.findById(documentId).ifPresent(doc -> {
            try {
                if (doc.getStoragePath() != null) {
                    Files.deleteIfExists(Paths.get(doc.getStoragePath()));
                }
            } catch (Exception ignored) {}
            documentChunkRepository.deleteAll(documentChunkRepository.findByDocumentId(documentId));
            documentRepository.delete(doc);
        });
    }

    public void emptyTrash(Long userId) {
        List<Document> trashedDocs = documentRepository.findByUserIdAndTrashedTrue(userId);
        for (Document doc : trashedDocs) {
            try {
                if (doc.getStoragePath() != null) {
                    Files.deleteIfExists(Paths.get(doc.getStoragePath()));
                }
            } catch (Exception ignored) {}
            documentChunkRepository.deleteAll(documentChunkRepository.findByDocumentId(doc.getId()));
        }
        documentRepository.deleteAll(trashedDocs);
    }

    // Legacy method kept for backwards compatibility
    public void deleteDocument(Long documentId) {
        softDeleteDocument(documentId);
    }
}

