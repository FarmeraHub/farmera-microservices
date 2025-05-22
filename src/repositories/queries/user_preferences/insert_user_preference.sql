INSERT INTO user_preferences (
    user_id, user_email, 
    transactional_channels, system_alert_channels, chat_channels, 
    do_not_disturb_start, do_not_disturb_end, 
    daily_limits
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;