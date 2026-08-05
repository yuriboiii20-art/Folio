package com.folio.controller;

import com.folio.model.PersonalNote;
import com.folio.model.Subject;
import com.folio.model.User;
import com.folio.repository.PersonalNoteRepository;
import com.folio.repository.SubjectRepository;
import com.folio.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/notes")
@CrossOrigin(origins = "*")
public class NoteController {

    private final PersonalNoteRepository noteRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    public NoteController(PersonalNoteRepository noteRepository,
                          SubjectRepository subjectRepository,
                          UserRepository userRepository) {
        this.noteRepository = noteRepository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
    }

    private User getDevUser() {
        return userRepository.findByEmail("student@folio.edu").orElseGet(() ->
            userRepository.save(User.builder().email("student@folio.edu").fullName("Student User").password("password").build())
        );
    }

    @GetMapping
    public ResponseEntity<List<PersonalNote>> getNotes(@RequestParam(required = false) Long subjectId) {
        User user = getDevUser();
        if (subjectId != null) {
            return ResponseEntity.ok(noteRepository.findBySubjectId(subjectId));
        }
        return ResponseEntity.ok(noteRepository.findByUserId(user.getId()));
    }

    @PostMapping
    public ResponseEntity<PersonalNote> createNote(@RequestBody PersonalNote note) {
        User user = getDevUser();
        note.setUser(user);
        if (note.getSubject() != null && note.getSubject().getId() != null) {
            Subject s = subjectRepository.findById(note.getSubject().getId()).orElse(null);
            note.setSubject(s);
        }
        return ResponseEntity.ok(noteRepository.save(note));
    }
}
