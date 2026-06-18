package com.aicrm.task;

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
class TaskControllerTest {

    @Autowired private MockMvc mockMvc;

    private String token;
    private String adminUserId;

    @BeforeEach
    void obtainTokenAndUserId() throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@aicrm.local\",\"password\":\"Admin1234!\"}"))
                .andReturn().getResponse().getContentAsString();
        token = response.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");

        String meResponse = mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andReturn().getResponse().getContentAsString();
        adminUserId = meResponse.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");
    }

    @Test
    void getTasks_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getTasks_withToken_returns200() throws Exception {
        mockMvc.perform(get("/api/tasks")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.page").isNumber());
    }

    @Test
    void createTask_withValidBody_returns201() throws Exception {
        String body = String.format("""
            {
              "title": "Test Task",
              "dueDate": "2026-12-31",
              "assigneeId": "%s"
            }
            """, adminUserId);

        mockMvc.perform(post("/api/tasks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Test Task"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.assigneeId").value(adminUserId));
    }

    @Test
    void createTask_missingTitle_returns422() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"dueDate\":\"2026-12-31\",\"assigneeId\":\"%s\"}", adminUserId)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void getTask_nonExistent_returns404() throws Exception {
        mockMvc.perform(get("/api/tasks/nonexistent-id")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void fullTaskCycle_createToggleUpdateDelete() throws Exception {
        // Create
        String createBody = String.format("""
            {"title":"CRUD Task","dueDate":"2026-12-31","assigneeId":"%s"}
            """, adminUserId);

        String createResponse = mockMvc.perform(post("/api/tasks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String taskId = createResponse.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

        // Toggle to COMPLETED
        mockMvc.perform(patch("/api/tasks/" + taskId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"COMPLETED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        // Toggle back to PENDING
        mockMvc.perform(patch("/api/tasks/" + taskId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PENDING\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));

        // Update
        String updateBody = String.format("""
            {"title":"Updated Task","dueDate":"2027-01-15","assigneeId":"%s"}
            """, adminUserId);
        mockMvc.perform(put("/api/tasks/" + taskId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Task"));

        // Filter by OVERDUE — list works
        mockMvc.perform(get("/api/tasks?filter=OVERDUE")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        // Delete
        mockMvc.perform(delete("/api/tasks/" + taskId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        // Verify deleted
        mockMvc.perform(get("/api/tasks/" + taskId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }
}
