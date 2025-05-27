UPDATE user_notifications 
SET status = $3, delivered_at = $4 
WHERE recipient = $1 AND notification_id = $2;