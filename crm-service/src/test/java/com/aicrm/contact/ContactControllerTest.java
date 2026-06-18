package com.aicrm.contact;

import com.aicrm.config.TestcontainersConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfig.class)
@ActiveProfiles("dev")
class ContactControllerTest {

    @Autowired private MockMvc mockMvc;

    private String token;

    @BeforeEach
    void obtainToken() throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@aicrm.local\",\"password\":\"Admin1234!\"}"))
                .andReturn().getResponse().getContentAsString();
        token = response.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
    }

    @Test
    void getContacts_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/contacts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getContacts_withToken_returns200() throws Exception {
        mockMvc.perform(get("/api/contacts")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").isNumber())
                .andExpect(jsonPath("$.page").isNumber())
                .andExpect(jsonPath("$.size").isNumber());
    }

    @Test
    void createContact_withValidBody_returns201() throws Exception {
        String body = """
            {
              "firstName": "Test",
              "lastName": "User",
              "email": "testuser@example.com"
            }
            """;
        mockMvc.perform(post("/api/contacts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.firstName").value("Test"))
                .andExpect(jsonPath("$.lastName").value("User"));
    }

    @Test
    void createContact_missingFirstName_returns422() throws Exception {
        mockMvc.perform(post("/api/contacts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lastName\":\"User\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void getContact_nonExistent_returns404() throws Exception {
        mockMvc.perform(get("/api/contacts/nonexistent-id")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void fullContactCrud_createUpdateDelete() throws Exception {
        // Create
        String createBody = """
            {"firstName":"CRUD","lastName":"Test","email":"crud@example.com"}
            """;
        String createResponse = mockMvc.perform(post("/api/contacts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String contactId = createResponse.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

        // Get
        mockMvc.perform(get("/api/contacts/" + contactId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("CRUD"));

        // Update
        String updateBody = """
            {"firstName":"Updated","lastName":"Test","email":"crud@example.com"}
            """;
        mockMvc.perform(put("/api/contacts/" + contactId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Updated"));

        // Delete
        mockMvc.perform(delete("/api/contacts/" + contactId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        // Verify deleted
        mockMvc.perform(get("/api/contacts/" + contactId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }
}
