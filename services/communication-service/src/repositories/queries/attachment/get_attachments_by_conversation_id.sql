SELECT attachment_id, message_id, conversation_id, file_url, file_size, file_type, created
FROM attachments 
WHERE conversation_id = $1 
    AND file_type IN ('image', 'video') 
    AND deleted = FALSE 
    AND ($2 IS NULL OR created < $2) 
ORDER BY attachment_id DESC 
LIMIT $3;