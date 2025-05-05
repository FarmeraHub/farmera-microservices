INSERT INTO notifications (template_id, title, content, channel) 
VALUES ($1, $2, $3, $4) RETURNING notification_id;