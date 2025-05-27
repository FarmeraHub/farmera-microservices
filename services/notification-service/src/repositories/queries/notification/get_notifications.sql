SELECT notification_id, template_id, title, content, channel, created, updated 
FROM notifications 
ORDER BY {{order}} {{asc}}
LIMIT $1;