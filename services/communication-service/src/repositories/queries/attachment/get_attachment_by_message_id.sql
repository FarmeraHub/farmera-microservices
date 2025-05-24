SELECT attachment_id, message_id, conversation_id, file_url, file_size, file_type, created
FROM attachments 
WHERE message_id = $1;