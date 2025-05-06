SELECT template_id, name, content, created, updated
FROM templates 
ORDER BY {{order}} {{asc}}
LIMIT $1;