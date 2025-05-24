SELECT id 
FROM users_conversations 
WHERE user_id = $1 AND conversation_id = $2;