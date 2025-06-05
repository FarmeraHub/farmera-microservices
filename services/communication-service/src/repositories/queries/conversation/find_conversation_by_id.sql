SELECT
    conversation_id,
    title,
    latest_message,
    created_at
FROM conversations
WHERE
    conversation_id = $1
    AND is_deleted = FALSE;