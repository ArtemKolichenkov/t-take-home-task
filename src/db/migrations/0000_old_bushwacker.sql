CREATE EXTENSION IF NOT EXISTS citext;
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" "citext" NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
