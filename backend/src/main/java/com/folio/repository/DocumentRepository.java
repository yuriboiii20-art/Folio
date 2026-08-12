package com.folio.repository;

import com.folio.model.Document;
import com.folio.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUser(User user);
    List<Document> findByUserId(Long userId);
    List<Document> findBySubjectId(Long subjectId);
    List<Document> findByUserIdAndFavoriteTrue(Long userId);

    // Soft-delete aware queries
    List<Document> findByUserIdAndTrashedFalse(Long userId);
    List<Document> findByUserIdAndTrashedTrue(Long userId);
    List<Document> findBySubjectIdAndTrashedFalse(Long subjectId);

    @Query("SELECT d FROM Document d WHERE d.user.id = :userId AND d.trashed = false AND " +
           "(LOWER(d.filename) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.extractedText) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Document> searchKeyword(@Param("userId") Long userId, @Param("query") String query);
}
