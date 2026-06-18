package com.aicrm.dashboard;

import com.aicrm.config.TestcontainersConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfig.class)
@ActiveProfiles("dev")
class DashboardControllerTest {

    @Autowired private MockMvc mockMvc;

    private String token;

    @BeforeEach
    void obtainToken() throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@aicrm.local\",\"password\":\"Admin1234!\"}"))
                .andReturn().getResponse().getContentAsString();
        token = response.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
    }

    @Test
    void getSummary_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getSummary_withToken_returns200WithAllFields() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metrics").exists())
                .andExpect(jsonPath("$.metrics.openDealCount").isNumber())
                .andExpect(jsonPath("$.metrics.totalPipelineValue").isNumber())
                .andExpect(jsonPath("$.metrics.todayTaskCount").isNumber())
                .andExpect(jsonPath("$.metrics.newContactCount").isNumber())
                .andExpect(jsonPath("$.pipelineSummary").isArray())
                .andExpect(jsonPath("$.myTasks").isArray())
                .andExpect(jsonPath("$.recentActivities").isArray());
    }
}
