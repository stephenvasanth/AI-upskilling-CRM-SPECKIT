package com.aicrm.auth;

import com.aicrm.config.TestcontainersConfig;
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
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;

    @Test
    void login_validCredentials_returns200WithToken() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@aicrm.local\",\"password\":\"Admin1234!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("admin@aicrm.local"))
                .andExpect(jsonPath("$.user.role").value("ADMIN"));
    }

    @Test
    void login_wrongPassword_returns401WithAuthFailed() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@aicrm.local\",\"password\":\"wrongpass\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("AUTH_FAILED"))
                .andExpect(jsonPath("$.error.message").value("Invalid email or password"));
    }

    @Test
    void login_missingEmail_returns422() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"Admin1234!\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void getMe_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    void getMe_withValidToken_returns200() throws Exception {
        String token = obtainToken();
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@aicrm.local"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void updateProfile_withValidToken_returns200() throws Exception {
        String token = obtainToken();
        mockMvc.perform(put("/api/auth/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"displayName\":\"Updated Admin\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Updated Admin"));
    }

    @Test
    void updatePassword_wrongCurrentPassword_returns400() throws Exception {
        String token = obtainToken();
        mockMvc.perform(put("/api/auth/password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"wrong\",\"newPassword\":\"NewPass123!\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_PASSWORD"));
    }

    private String obtainToken() throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@aicrm.local\",\"password\":\"Admin1234!\"}"))
                .andReturn().getResponse().getContentAsString();
        return response.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
    }
}
