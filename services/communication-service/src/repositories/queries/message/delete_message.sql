UPDATE messages 
SET deleted = true 
WHERE message_id = $1;