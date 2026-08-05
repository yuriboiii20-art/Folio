package com.folio.repository;

import com.folio.model.Subject;
import com.folio.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findByUser(User user);
    List<Subject> findByUserId(Long userId);
}
