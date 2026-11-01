package com.orange.security.auth;

import com.orange.entity.LoginAttempt;
import com.orange.repository.system.LoginAttemptRepository;
import com.orange.security.config.AuthProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoginAttemptServiceTest {

    @Mock
    private LoginAttemptRepository repository;

    private LoginAttemptService service;

    @BeforeEach
    void setUp() {
        service = new LoginAttemptService(repository,
                new AuthProperties(false, "Lax", "", 2, 3, 15));
    }

    @Test
    void isBlockedUsesNormalizedKeys() {
        when(repository.isLocked("ip:1.2.3.4")).thenReturn(false);
        when(repository.isLocked("user:alice")).thenReturn(true);

        assertTrue(service.isBlocked(" 1.2.3.4 ", " Alice "));
    }

    @Test
    void onSuccessDeletesUserKey() {
        when(repository.findById("user:alice")).thenReturn(Optional.of(new LoginAttempt()));

        service.onSuccess("1.2.3.4", " Alice ");

        verify(repository).delete(any(LoginAttempt.class));
    }

    @Test
    void onFailureLocksAccountAndIpAfterThreshold() {
        OffsetDateTime windowStart = OffsetDateTime.now().minusMinutes(1);
        when(repository.findForUpdate("ip:1.2.3.4"))
                .thenReturn(Optional.of(attempt("ip:1.2.3.4", 2, windowStart)));
        when(repository.findForUpdate("user:alice"))
                .thenReturn(Optional.of(attempt("user:alice", 1, windowStart)));

        service.onFailure("1.2.3.4", " Alice ");

        ArgumentCaptor<LoginAttempt> captor = ArgumentCaptor.forClass(LoginAttempt.class);
        verify(repository, times(2)).save(captor.capture());
        for (LoginAttempt saved : captor.getAllValues()) {
            assertNotNull(saved.getLockedUntil());
            if ("ip:1.2.3.4".equals(saved.getKey())) {
                assertEquals(3, saved.getFailures());
            } else {
                assertEquals(2, saved.getFailures());
            }
        }
    }

    private LoginAttempt attempt(String key, int failures, OffsetDateTime windowStart) {
        LoginAttempt attempt = new LoginAttempt();
        attempt.setKey(key);
        attempt.setFailures(failures);
        attempt.setWindowStart(windowStart);
        return attempt;
    }
}
