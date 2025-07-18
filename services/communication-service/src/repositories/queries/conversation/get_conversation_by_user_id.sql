SELECT
    us.id,
    us.conversation_id,
    c.title,
    m.message_id,
    m.sender_id,
    m.content,
    m.sent_at,
    m.is_read,
    m.type,
    ARRAY (
        SELECT uc.user_id
        FROM users_conversations uc
        WHERE
            uc.conversation_id = us.conversation_id
    ) AS participants,
    c.created_at
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
ORDER BY m.sent_at DESC NULLS LAST
LIMIT $2
OFFSET
    $3;