db.Users.dropIndexes()
db.Users.createIndex({username: 1}, {unique: true})

// ========================================================================

db.TokensLog.dropIndexes()

// Only one token per user
db.TokensLog.createIndex({user: 1}, {unique: true})

// Token deemed expired after 60 minutes
db.TokensLog.createIndex({lastUse: 1}, {expireAfterSeconds: 3600})
