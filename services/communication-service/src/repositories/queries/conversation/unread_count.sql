SELECT COUNT(*)
FROM messages
WHERE
    is_read = FALSE
    AND sender_id != $1
    AND conversation_id IN (
        SELECT conversation_id
        FROM users_conversations
        WHERE
            user_id = $1
    )