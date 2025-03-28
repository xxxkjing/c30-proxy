CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    method VARCHAR(10) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    path TEXT NOT NULL,
    client_ip VARCHAR(45),
    headers JSONB
);

CREATE INDEX idx_timestamp ON requests(timestamp);
CREATE INDEX idx_domain ON requests(domain);
