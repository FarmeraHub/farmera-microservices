UPDATE user_notifications 
SET status = $2, delivered_at = $3 
WHERE id = $1;