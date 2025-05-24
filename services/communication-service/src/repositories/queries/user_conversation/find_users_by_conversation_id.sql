SELECT id, conversation_id, user_id, deleted_at 
FROM users_conversations 
WHERE conversation_id = $1;