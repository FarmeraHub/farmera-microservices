SELECT template_id, name, content, created 
FROM templates 
WHERE template_id = $1;