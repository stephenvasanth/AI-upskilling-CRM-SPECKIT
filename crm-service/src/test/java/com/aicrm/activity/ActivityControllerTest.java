package com.aicrm.activity;

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
class ActivityControllerTest {

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
    void getActivities_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/activities"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getActivities_globalFeed_returns200() throws Exception {
        mockMvc.perform(get("/api/activities")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").isNumber())
                .andExpect(jsonPath("$.page").isNumber());
    }

    @Test
    void createActivity_withValidBody_returns201AndSetsAuthorServerSide() throws Exception {
        String body = """
            {
              "type": "CALL",
              "subject": "Test call activity"
            }
            """;
        mockMvc.perform(post("/api/activities")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.type").value("CALL"))
                .andExpect(jsonPath("$.subject").value("Test call activity"))
                .andExpect(jsonPath("$.authorId").isNotEmpty());
    }

    @Test
    void createActivity_missingType_returns422() throws Exception {
        mockMvc.perform(post("/api/activities")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"subject\":\"no type\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void createActivity_missingSubject_returns422() throws Exception {
        mockMvc.perform(post("/api/activities")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"NOTE\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void deleteActivity_nonExistent_returns404() throws Exception {
        mockMvc.perform(delete("/api/activities/nonexistent-id")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void fullActivityCycle_createAndDelete() throws Exception {
        // Create
        String body = """
            {"type":"EMAIL","subject":"Integration test email","notes":"Some notes"}
            """;
        String createResponse = mockMvc.perform(post("/api/activities")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String activityId = createResponse.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

        // Verify in global feed
        mockMvc.perform(get("/api/activities")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        // Filter by type
        mockMvc.perform(get("/api/activities?type=EMAIL")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        // Delete
        mockMvc.perform(delete("/api/activities/" + activityId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        // Verify deleted
        mockMvc.perform(delete("/api/activities/" + activityId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }
}
