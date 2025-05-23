DROP TABLE IF EXISTS user_notifications;

DROP TABLE IF EXISTS notifications;

DROP TABLE IF EXISTS templates;

DROP TABLE IF EXISTS user_preferences;

DROP TABLE IF EXISTS user_device_token;

CREATE TABLE user_notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient TEXT NOT NULL,
    notification_id BIGINT NOT NULL,
    status TEXT NOT NULL,
    delivered_at TIMESTAMPTZ
);

CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    template_id INT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    channel TEXT NOT NULL,
    created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE templates (
    template_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY,
    user_email TEXT,
    transactional_channels TEXT[],
    system_alert_channels TEXT[],
    chat_channels TEXT[],
    do_not_disturb_start TIME WITH TIME ZONE,
    do_not_disturb_end TIME WITH TIME ZONE
);

CREATE TABLE user_device_token (
    user_id UUID,
    token TEXT,
    PRIMARY KEY (user_id, token)
);

ALTER TABLE notifications
ADD CONSTRAINT fk_nt_tmpl FOREIGN KEY (template_id) REFERENCES templates (template_id);

ALTER TABLE user_notifications
ADD CONSTRAINT fk_un_nt FOREIGN KEY (notification_id) REFERENCES notifications (notification_id);

ALTER TABLE user_device_token
ADD CONSTRAINT fk_us_up FOREIGN KEY (user_id) REFERENCES user_preferences (user_id);