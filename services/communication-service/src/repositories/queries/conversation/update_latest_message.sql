UPDATE conversations
SET
    latest_message = $1
WHERE
    conversation_id = $2;