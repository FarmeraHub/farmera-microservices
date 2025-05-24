UPDATE conversations 
SET is_deleted = TRUE 
WHERE conversation_id = $1;