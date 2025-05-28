UPDATE user_preferences
SET
    user_email = $2,
    transactional_channels = $3,
    system_alert_channels = $4,
    chat_channels = $5,
    do_not_disturb_start = $6,
    do_not_disturb_end = $7,
    time_zone = $8
WHERE
    user_id = $1 RETURNING *;