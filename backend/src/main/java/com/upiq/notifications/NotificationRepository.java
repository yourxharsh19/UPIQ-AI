package com.upiq.notifications;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO notifications (user_id, event_key, type, title, message, created_at) "
            + "VALUES (:userId, :eventKey, :type, :title, :message, CURRENT_TIMESTAMP) "
            + "ON CONFLICT (user_id, event_key) DO NOTHING", nativeQuery = true)
    int insertIfAbsent(@Param("userId") Long userId, @Param("eventKey") String eventKey,
            @Param("type") String type, @Param("title") String title, @Param("message") String message);

    List<Notification> findByUser_IdAndDismissedAtIsNullOrderByCreatedAtDesc(Long userId);

    long countByUser_IdAndReadAtIsNullAndDismissedAtIsNull(Long userId);

    Optional<Notification> findByIdAndUser_Id(Long id, Long userId);
}
