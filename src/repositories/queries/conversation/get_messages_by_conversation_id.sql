SELECT message_id, conversation_id, sender_id, content, sent_at, type 
FROM messages 
WHERE conversation_id = $1 
    AND deleted = FALSE 
    AND ($2 IS NULL OR sent_at < $2) 
ORDER BY sent_at DESC 
LIMIT $3;