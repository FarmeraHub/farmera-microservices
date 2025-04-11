DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS users_conversations;
DROP TABLE IF EXISTS conversations;

CREATE TABLE users_conversations (
    id BIGSERIAL PRIMARY KEY,
    conversation_id INT,
    user_id UUID,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE conversations (
    conversation_id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    lastest_message BIGINT,
    lastest_active TIMESTAMPTZ,
    created_at TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN
);

CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    conversation_id BIGINT,
    sender_id UUID,
    content TEXT,
    status text,
    sent_at TIMESTAMP DEFAULT NOW(),
    is_read BOOLEAN,
    deleted BOOLEAN
);

CREATE TABLE attachments (
    attachment_id SERIAL PRIMARY KEY,
    message_id BIGINT,
    file_url TEXT,
    file_type TEXT,
    created TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users_conversations ADD CONSTRAINT cvs_us FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id);
ALTER TABLE messages ADD CONSTRAINT msg_cvs FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id);
ALTER TABLE attachments ADD CONSTRAINT atm_msg FOREIGN KEY (message_id) REFERENCES messages(message_id);