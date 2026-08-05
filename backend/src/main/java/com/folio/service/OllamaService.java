package com.folio.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class OllamaService {

    @Value("${folio.ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    @Value("${folio.ollama.model:llama3.2}")
    private String modelName;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String generateResponse(String prompt, String contextText) {
        try {
            String fullPrompt = "Context information from uploaded student notes:\n" + contextText + 
                                "\n\nUser Question: " + prompt + 
                                "\n\nAnswer concisely and accurately based on the context above. Include document references if available.";

            Map<String, Object> request = new HashMap<>();
            request.put("model", modelName);
            request.put("prompt", fullPrompt);
            request.put("stream", false);

            Map<?, ?> response = restTemplate.postForObject(ollamaUrl + "/api/generate", request, Map.class);
            if (response != null && response.containsKey("response")) {
                return (String) response.get("response");
            }
            return "No response generated from Ollama AI.";
        } catch (Exception e) {
            return "Ollama AI Assistant is currently offline or unreachable at " + ollamaUrl + ". Error: " + e.getMessage();
        }
    }
}
