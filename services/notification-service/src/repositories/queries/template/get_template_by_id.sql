SELECT template_id, name, content, created, updated
FROM templates 
WHERE template_id = $1;