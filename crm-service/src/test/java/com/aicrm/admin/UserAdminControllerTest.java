package com.aicrm.admin;

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
class UserAdminControllerTest {

    @Autowired private MockMvc mockMvc;

    private String adminToken;
    private String userToken;

    @BeforeEach
    void obtainTokens() throws Exception {
        String adminResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@aicrm.local\",\"password\":\"Admin1234!\"}"))
                .andReturn().getResponse().getContentAsString();
        adminToken = adminResponse.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");

        String userResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"alice@aicrm.local\",\"password\":\"Alice1234!\"}"))
                .andReturn().getResponse().getContentAsString();
        userToken = userResponse.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
    }

    @Test
    void getUsers_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getUsers_withUserRole_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUsers_withAdminRole_returns200() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void createUser_withAdminRole_returns201() throws Exception {
        String body = """
            {
              "email": "newuser@test.com",
              "displayName": "New User",
              "initialPassword": "Password1!",
              "role": "USER"
            }
            """;

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("newuser@test.com"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void createUser_withUserRole_returns403() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"x@x.com\",\"displayName\":\"X\",\"initialPassword\":\"pass1234\",\"role\":\"USER\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void createUser_duplicateEmail_returns409() throws Exception {
        String body = """
            {
              "email": "admin@aicrm.local",
              "displayName": "Dup Admin",
              "initialPassword": "Password1!",
              "role": "USER"
            }
            """;

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("CONFLICT"));
    }

    @Test
    void getTags_withAdminRole_returns200() throws Exception {
        mockMvc.perform(get("/api/admin/tags")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getTags_withUserRole_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/tags")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void tagCycle_createAndDelete() throws Exception {
        String createBody = "{\"name\":\"TestTag\",\"colour\":\"#3b82f6\"}";

        String createResponse = mockMvc.perform(post("/api/admin/tags")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("TestTag"))
                .andReturn().getResponse().getContentAsString();

        String tagId = createResponse.replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(delete("/api/admin/tags/" + tagId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }
}
