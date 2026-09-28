# The admin is a single shared password, not accounts

There are no admin accounts: anyone who knows `ADMIN_PASSWORD` (a Vercel environment variable) is the admin and gets a signed session cookie valid for 7 days. We chose this over per-admin accounts with hashed passwords because the app has one operator and no need to tell admins apart; the cost is that access can't be revoked per person, only by changing the password (and `SESSION_SECRET`, to end existing sessions).
