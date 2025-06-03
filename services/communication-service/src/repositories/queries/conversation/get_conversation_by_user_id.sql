SELECT us.id, us.conversation_id, c.title, m.message_id, m.sender_id, m.content, m.sent_at, m.is_read, m.type
FROM
    users_conversations us
    JOIN conversations c ON us.conversation_id = c.conversation_id
    LEFT JOIN messages m ON c.latest_message = m.message_id
    AND m.deleted = FALSE
WHERE
    us.user_id = $1
    AND (
        m.sent_at IS NULL
        OR us.deleted_at IS NULL
        OR us.deleted_at < m.sent_at
    )
ORDER BY m.sent_at DESC
LIMIT $2
OFFSET
    $3;