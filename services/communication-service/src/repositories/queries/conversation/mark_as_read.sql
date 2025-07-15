UPDATE messages
SET
    is_read = TRUE
WHERE
    conversation_id = $1
    AND is_read = FALSE
    AND sender_id != $2;