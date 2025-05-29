SELECT message_id, conversation_id, sender_id, content, type, sent_at, is_read
FROM messages 
WHERE message_id = $1 AND deleted = FALSE;