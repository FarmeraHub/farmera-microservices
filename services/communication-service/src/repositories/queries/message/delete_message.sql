UPDATE messages
SET
    deleted = true
WHERE
    message_id = $1
    AND sender_id = $2;