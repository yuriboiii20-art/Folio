package com.folio.controller;

import com.folio.model.Document;
import com.folio.model.Subject;
import com.folio.model.User;
import com.folio.repository.SubjectRepository;
import com.folio.repository.UserRepository;
import com.folio.service.DocumentService;
import com.folio.service.OllamaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/v1")
@CrossOrigin(origins = "*")
public class ApiController {

    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final DocumentService documentService;
    private final OllamaService ollamaService;

    public ApiController(UserRepository userRepository,
                         SubjectRepository subjectRepository,
                         DocumentService documentService,
                         OllamaService ollamaService) {
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.documentService = documentService;
        this.ollamaService = ollamaService;
    }

    // Temporary dev default user helper
    private User getOrCreateDevUser() {
        return userRepository.findByEmail("student@folio.edu")
                .orElseGet(() -> userRepository.save(User.builder()
                        .email("student@folio.edu")
                        .password("password")
                        .fullName("Student User")
                        .role(User.Role.STUDENT)
                        .build()));
    }

    @GetMapping("/subjects")
    public ResponseEntity<List<Subject>> getSubjects() {
        User user = getOrCreateDevUser();
        return ResponseEntity.ok(subjectRepository.findByUser(user));
    }

    @PostMapping("/subjects")
    public ResponseEntity<Subject> createSubject(@RequestBody Subject subject) {
        User user = getOrCreateDevUser();
        subject.setUser(user);
        return ResponseEntity.ok(subjectRepository.save(subject));
    }

    @GetMapping("/documents")
    public ResponseEntity<List<Document>> getDocuments(@RequestParam(required = false) Long subjectId) {
        User user = getOrCreateDevUser();
        if (subjectId != null) {
            return ResponseEntity.ok(documentService.getSubjectDocuments(subjectId));
        }
        return ResponseEntity.ok(documentService.getUserDocuments(user.getId()));
    }

    @PostMapping("/documents/upload")
    public ResponseEntity<?> uploadDocument(@RequestParam("file") MultipartFile file,
                                            @RequestParam(value = "subjectId", required = false) Long subjectId,
                                            @RequestParam(value = "source", required = false) String source) {
        try {
            User user = getOrCreateDevUser();
            Subject subject = subjectId != null ? subjectRepository.findById(subjectId).orElse(null) : null;
            Document doc = documentService.uploadDocument(file, subject, user, source);
            return ResponseEntity.ok(doc);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/documents/search")
    public ResponseEntity<List<Document>> searchDocuments(@RequestParam("q") String query) {
        User user = getOrCreateDevUser();
        return ResponseEntity.ok(documentService.searchKeyword(user.getId(), query));
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id) {
        documentService.softDeleteDocument(id);
        return ResponseEntity.ok(Map.of("message", "Document moved to trash."));
    }

    @GetMapping("/documents/trash")
    public ResponseEntity<List<Document>> getTrashedDocuments() {
        User user = getOrCreateDevUser();
        return ResponseEntity.ok(documentService.getTrashedDocuments(user.getId()));
    }

    @PutMapping("/documents/{id}/restore")
    public ResponseEntity<?> restoreDocument(@PathVariable Long id) {
        documentService.restoreDocument(id);
        return ResponseEntity.ok(Map.of("message", "Document restored from trash."));
    }

    @DeleteMapping("/documents/{id}/permanent")
    public ResponseEntity<?> permanentlyDeleteDocument(@PathVariable Long id) {
        documentService.permanentlyDeleteDocument(id);
        return ResponseEntity.ok(Map.of("message", "Document permanently deleted."));
    }

    @DeleteMapping("/documents/trash/empty")
    public ResponseEntity<?> emptyTrash() {
        User user = getOrCreateDevUser();
        documentService.emptyTrash(user.getId());
        return ResponseEntity.ok(Map.of("message", "Trash emptied successfully."));
    }

    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<?> deleteSubject(@PathVariable Long id) {
        subjectRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Subject folder deleted successfully from database."));
    }

    @GetMapping("/user/profile")
    public ResponseEntity<User> getUserProfile() {
        return ResponseEntity.ok(getOrCreateDevUser());
    }

    @PutMapping("/user/profile")
    public ResponseEntity<?> updateUserProfile(@RequestBody Map<String, String> body) {
        User user = getOrCreateDevUser();
        if (body.containsKey("fullName")) user.setFullName(body.get("fullName"));
        if (body.containsKey("email")) user.setEmail(body.get("email"));
        User updated = userRepository.save(user);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/user/password")
    public ResponseEntity<?> updatePassword(@RequestBody Map<String, String> body) {
        User user = getOrCreateDevUser();
        String newPassword = body.get("newPassword");
        if (newPassword != null && !newPassword.isBlank()) {
            user.setPassword(newPassword);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Password updated successfully in database."));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid password."));
    }

    @PostMapping("/ai/chat")
    public ResponseEntity<Map<String, String>> aiChat(@RequestBody Map<String, String> body) {
        User user = getOrCreateDevUser();
        String question = body.get("question");

        List<Document> docs = documentService.getUserDocuments(user.getId());
        StringBuilder context = new StringBuilder();
        for (Document doc : docs) {
            if (doc.getExtractedText() != null) {
                context.append("--- Document: ").append(doc.getFilename()).append(" ---\n");
                context.append(doc.getExtractedText().substring(0, Math.min(doc.getExtractedText().length(), 1000))).append("\n\n");
            }
        }

        String aiResponse = ollamaService.generateResponse(question, context.toString());
        return ResponseEntity.ok(Map.of("answer", aiResponse));
    }
}
