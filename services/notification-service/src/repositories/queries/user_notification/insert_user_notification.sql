INSERT INTO user_notifications (recipient, notification_id, status, delivered_at) 
VALUES ($1, $2, $3, $4) RETURNING id;