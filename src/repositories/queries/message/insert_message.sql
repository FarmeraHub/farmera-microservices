INSERT INTO messages (conversation_id, sender_id, content, type, sent_at, is_read) 
VALUES ($1, $2, $3, $4, $5, COALESCE($6, false)) RETURNING message_id;