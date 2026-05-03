package com.hubify.interfaces.rest;
import com.hubify.domain.model.DocumentEntity;
import com.hubify.infrastructure.persistence.DocumentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/data")
@CrossOrigin(origins = "*")
public class DocumentController {
    @Autowired private DocumentRepository repo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/{collection}")
    public List<DocumentEntity> getAll(@PathVariable String collection) {
        return repo.findByCollectionName(collection);
    }

    @PostMapping("/{collection}")
    public ResponseEntity<DocumentEntity> save(@PathVariable String collection, @RequestBody Object data) {
        try {
            String jsonData;
            if (data instanceof String) {
                jsonData = (String) data;
            } else {
                jsonData = objectMapper.writeValueAsString(data);
            }

            // Extrair ID do JSON se existir
            String id = null;
            try {
                JsonNode jsonNode = objectMapper.readTree(jsonData);
                JsonNode idNode = jsonNode.get("id");
                if (idNode != null && !idNode.isNull()) {
                    id = idNode.asText();
                }
            } catch (Exception e) {
                System.err.println("Erro ao extrair ID: " + e.getMessage());
            }

            // Verificar se já existe (UPSERT)
            if (id != null && !id.isEmpty()) {
                List<DocumentEntity> existing = repo.findByCollectionName(collection);
                for (DocumentEntity doc : existing) {
                    try {
                        JsonNode existingJsonNode = objectMapper.readTree(doc.getJsonData());
                        JsonNode existingIdNode = existingJsonNode.get("id");
                        if (existingIdNode != null && !existingIdNode.isNull()) {
                            String existingId = existingIdNode.asText();
                            if (existingId.equals(id)) {
                                System.out.println("Atualizando documento com ID: " + id);
                                doc.setJsonData(jsonData);
                                return ResponseEntity.ok(repo.save(doc));
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("Erro ao verificar documento existente: " + e.getMessage());
                    }
                }
                System.out.println("Documento com ID " + id + " não encontrado, criando novo");
            }

            // Se não existe, criar novo
            DocumentEntity doc = new DocumentEntity();
            doc.setCollectionName(collection);
            doc.setJsonData(jsonData);
            return ResponseEntity.ok(repo.save(doc));
        } catch (Exception e) {
            System.err.println("Erro em save: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{collection}/{id}")
    public ResponseEntity<DocumentEntity> update(@PathVariable String collection, @PathVariable String id, @RequestBody Object data) {
        try {
            String jsonData;
            if (data instanceof String) {
                jsonData = (String) data;
            } else {
                jsonData = objectMapper.writeValueAsString(data);
            }

            // Procurar por ID dentro do JSON
            List<DocumentEntity> docs = repo.findByCollectionName(collection);
            for (DocumentEntity doc : docs) {
                try {
                    JsonNode existingJsonNode = objectMapper.readTree(doc.getJsonData());
                    JsonNode existingIdNode = existingJsonNode.get("id");
                    if (existingIdNode != null && !existingIdNode.isNull()) {
                        String existingId = existingIdNode.asText();
                        if (existingId.equals(id)) {
                            doc.setJsonData(jsonData);
                            return ResponseEntity.ok(repo.save(doc));
                        }
                    }
                } catch (Exception e) {
                    // Continuar procurando
                }
            }

            // Se não encontrou, retornar 404
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{collection}/{id}")
    public ResponseEntity<Void> delete(@PathVariable String collection, @PathVariable String id) {
        try {
            System.out.println(">>> REQUISIÇÃO DE EXCLUSÃO recebida");
            System.out.println(">>> Coleção: " + collection);
            System.out.println(">>> ID alvo: " + id);
            
            // 1. Tentar deletar por ID primário do banco (UUID)
            if (repo.existsById(id)) {
                System.out.println(">>> Documento encontrado por ID primário. Deletando...");
                repo.deleteById(id);
                return ResponseEntity.ok().build();
            }

            // 2. Tentar buscar pelo ID dentro do JSON (fallback para IDs personalizados como group_...)
            List<DocumentEntity> all = repo.findByCollectionName(collection);
            System.out.println(">>> Buscando em " + all.size() + " documentos da coleção '" + collection + "'");
            
            for (DocumentEntity doc : all) {
                try {
                    JsonNode json = objectMapper.readTree(doc.getJsonData());
                    JsonNode idNode = json.get("id");
                    if (idNode != null && idNode.asText().equals(id)) {
                        System.out.println(">>> Documento encontrado via JSON ID: " + id + ". Deletando BD ID: " + doc.getId());
                        repo.delete(doc);
                        return ResponseEntity.ok().build();
                    }
                } catch (Exception e) {
                    // Ignorar erros de parse individuais
                }
            }

            System.err.println(">>> AVISO: Documento " + id + " não encontrado na coleção " + collection);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println(">>> ERRO CRÍTICO em deleteDoc: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
}
