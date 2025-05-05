DROP TABLE IF EXISTS user_notifications;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS templates;


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
    created TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ADD CONSTRAINT fk_nt_tmpl FOREIGN KEY (template_id) REFERENCES templates(template_id);
ALTER TABLE user_notifications ADD CONSTRAINT fk_un_nt FOREIGN KEY (notification_id) REFERENCES notifications(notification_id);