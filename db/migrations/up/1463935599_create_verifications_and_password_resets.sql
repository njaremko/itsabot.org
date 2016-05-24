ALTER TABLE users ADD COLUMN verified BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN name VARCHAR(255);
CREATE TABLE verifications (
	userid INTEGER UNIQUE NOT NULL,
	code VARCHAR(255) NOT NULL
);
CREATE TABLE passwordresets (
	email VARCHAR(255) UNIQUE NOT NULL,
	code VARCHAR(255) NOT NULL,
	createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);