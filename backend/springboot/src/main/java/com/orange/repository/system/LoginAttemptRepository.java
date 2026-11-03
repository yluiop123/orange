package com.orange.repository.system;

import com.orange.entity.LoginAttempt;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from LoginAttempt a where a.key = :key")
    Optional<LoginAttempt> findForUpdate(@Param("key") String key);

    @Query("select count(a) > 0 from LoginAttempt a where a.key = :key and a.lockedUntil > CURRENT_TIMESTAMP")
    boolean isLocked(@Param("key") String key);
}
