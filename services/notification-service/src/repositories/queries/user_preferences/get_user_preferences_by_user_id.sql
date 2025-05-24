SELECT
    user_id,
    user_email,
    transactional_channels,
    system_alert_channels,
    chat_channels,
    do_not_disturb_start,
    do_not_disturb_end,
    time_zone
FROM user_preferences
WHERE
    user_id = $1;