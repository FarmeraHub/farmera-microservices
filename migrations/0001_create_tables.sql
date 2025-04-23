DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS users_conversations;
DROP TABLE IF EXISTS conversations;

CREATE TABLE users_conversations (
    id BIGSERIAL PRIMARY KEY,
    conversation_id INT NOT NULL,
    user_id UUID NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE conversations (
    conversation_id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    lastest_message BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE messages (
    message_id BIGSERIAL PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id UUID NOT NULL,
    content TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE,
    type TEXT DEFAULT 'message' CHECK(type IN('message', 'image', 'video')),
    deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE attachments (
    attachment_id SERIAL PRIMARY KEY,
    message_id BIGINT,
    file_url TEXT,
    file_type TEXT,
    created TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users_conversations ADD CONSTRAINT cvs_us FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id);
ALTER TABLE messages ADD CONSTRAINT msg_cvs FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id);
ALTER TABLE attachments ADD CONSTRAINT atm_msg FOREIGN KEY (message_id) REFERENCES messages(message_id);



INSERT INTO conversations (title) VALUES 
('First conversation'),
('Second conversation');

INSERT INTO users_conversations (conversation_id, user_id) VALUES 
(1, '11111111-1111-1111-1111-111111111111'),
(1, '22222222-2222-2222-2222-222222222222'),
(2, '33333333-3333-3333-3333-333333333333');

INSERT INTO messages (conversation_id, sender_id, content) VALUES 
(1, '11111111-1111-1111-1111-111111111111', 'This is the first message'),
(1, '22222222-2222-2222-2222-222222222222', 'This is the second message'),
(2, '33333333-3333-3333-3333-333333333333', 'This is the third message');