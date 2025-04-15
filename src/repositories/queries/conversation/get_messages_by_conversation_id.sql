SELECT message_id, conversation_id, sender_id, content, sent_at 
FROM messages 
WHERE conversation_id = $1 
    AND deleted = FALSE 
    AND (sent_at < $2 OR $2 IS NULL) 
ORDER BY sent_at DESC 
LIMIT $3;