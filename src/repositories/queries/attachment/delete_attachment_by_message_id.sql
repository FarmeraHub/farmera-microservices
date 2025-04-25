UPDATE attachments 
SET deleted = TRUE 
WHERE message_id = $1;