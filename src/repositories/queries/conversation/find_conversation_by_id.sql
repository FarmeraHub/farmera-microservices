SELECT c.conversation_id, c.title, c.farm_id, c.lastest_message, c.created_at 
FROM conversations c 
WHERE c.conversation_id = $1;