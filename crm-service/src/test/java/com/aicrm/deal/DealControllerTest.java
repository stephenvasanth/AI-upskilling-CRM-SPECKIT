package com.aicrm.deal;

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
class DealControllerTest {

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
    void getBoard_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/deals/board"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getBoard_withToken_returns200WithAllStages() throws Exception {
        mockMvc.perform(get("/api/deals/board")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stages.LEAD").isArray())
                .andExpect(jsonPath("$.stages.QUALIFIED").isArray())
                .andExpect(jsonPath("$.stages.PROPOSAL").isArray())
                .andExpect(jsonPath("$.stages.NEGOTIATION").isArray())
                .andExpect(jsonPath("$.stages.CLOSED_WON").isArray())
                .andExpect(jsonPath("$.stages.CLOSED_LOST").isArray());
    }

    @Test
    void createDeal_withValidBody_returns201() throws Exception {
        String body = """
            {
              "title": "Test Deal",
              "stage": "LEAD"
            }
            """;
        mockMvc.perform(post("/api/deals")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Test Deal"))
                .andExpect(jsonPath("$.stage").value("LEAD"));
    }

    @Test
    void createDeal_missingTitle_returns422() throws Exception {
        mockMvc.perform(post("/api/deals")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"stage\":\"LEAD\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void getDeal_nonExistent_returns404() throws Exception {
        mockMvc.perform(get("/api/deals/nonexistent-id")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void fullDealCrud_createUpdateMoveStageDelete() throws Exception {
        // Create
        String createBody = """
            {"title":"CRUD Deal","stage":"LEAD","value":9999.99}
            """;
        String createResponse = mockMvc.perform(post("/api/deals")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String dealId = createResponse.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

        // Get by ID
        mockMvc.perform(get("/api/deals/" + dealId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("CRUD Deal"))
                .andExpect(jsonPath("$.stage").value("LEAD"));

        // Update
        String updateBody = """
            {"title":"Updated Deal","stage":"QUALIFIED","value":12000}
            """;
        mockMvc.perform(put("/api/deals/" + dealId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Deal"))
                .andExpect(jsonPath("$.stage").value("QUALIFIED"));

        // Move stage via PATCH
        mockMvc.perform(patch("/api/deals/" + dealId + "/stage")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"stage\":\"PROPOSAL\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stage").value("PROPOSAL"));

        // Delete
        mockMvc.perform(delete("/api/deals/" + dealId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        // Verify deleted
        mockMvc.perform(get("/api/deals/" + dealId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }
}
