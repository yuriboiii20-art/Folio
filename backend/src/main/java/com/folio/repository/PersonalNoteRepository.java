package com.folio.repository;

import com.folio.model.PersonalNote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PersonalNoteRepository extends JpaRepository<PersonalNote, Long> {
    List<PersonalNote> findByUserId(Long userId);
    List<PersonalNote> findBySubjectId(Long subjectId);
}
