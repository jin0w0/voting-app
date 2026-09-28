# Voters are recognised per browser, not by login

Voters never log in; each browser gets an anonymous voter ID in a long-lived cookie (1 year), and the database allows one vote per (poll, voter ID). We accept that clearing cookies or using a private window lets someone vote again, because asking voters to log in would kill casual participation and IP-based limits would block people sharing one network.
