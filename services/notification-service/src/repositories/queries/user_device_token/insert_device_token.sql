INSERT INTO
    user_device_token (user_id, token)
VALUES ($1, $2) RETURNING *;