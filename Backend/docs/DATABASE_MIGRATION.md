# Database Migration Guide

## Overview

As of this update, the application has been refactored to use a single unified MongoDB database (`tfg_db`) with multiple collections instead of having separate databases for each feature.

## Changes

### Before (Multiple Databases)
- `users_db` with `users` collection - for authentication and settings
- `meetings_db` with `meetings` collection - for meeting data
- `chat_db` with `conversations` collection - for conversation data

### After (Single Database)
- `tfg_db` with the following collections:
  - `auth` - for user authentication (username, password)
  - `user_settings` - for user settings (providers, models, whisperx, templates)
  - `meetings` - for meeting data
  - `conversations` - for conversation data

## Migration Required

**IMPORTANT:** This is a breaking change. Existing data will NOT be automatically migrated.

### Migration Steps

If you have existing data that needs to be preserved, follow these steps:

#### Option 1: Manual Migration using mongosh

```bash
# Connect to your MongoDB instance
mongosh -u <username> -p <password>

# 1. Migrate auth data from users_db.users to tfg_db.auth
use users_db
db.users.aggregate([
  { $project: { username: 1, password: 1 } },
  { $merge: { into: { db: "tfg_db", coll: "auth" }, whenMatched: "replace" } }
])

# 2. Migrate user settings from users_db.users to tfg_db.user_settings
use users_db
db.users.aggregate([
  { $project: { username: 1, settings: 1 } },
  { $merge: { into: { db: "tfg_db", coll: "user_settings" }, whenMatched: "replace" } }
])

# 3. Migrate meetings data
use meetings_db
db.meetings.aggregate([
  { $merge: { into: { db: "tfg_db", coll: "meetings" }, whenMatched: "replace" } }
])

# 4. Migrate conversations data
use chat_db
db.conversations.aggregate([
  { $merge: { into: { db: "tfg_db", coll: "conversations" }, whenMatched: "replace" } }
])
```

#### Option 2: Python Migration Script

```python
import pymongo

# Connect to MongoDB
client = pymongo.MongoClient("mongodb://username:password@host:port")

# Migrate auth data
users_db = client["users_db"]
tfg_db = client["tfg_db"]

# Copy auth data (username and password only)
for user in users_db.users.find():
    tfg_db.auth.update_one(
        {"username": user["username"]},
        {"$set": {
            "username": user["username"],
            "password": user["password"]
        }},
        upsert=True
    )

# Copy user settings (username and settings only)
for user in users_db.users.find({"settings": {"$exists": True}}):
    tfg_db.user_settings.update_one(
        {"username": user["username"]},
        {"$set": {
            "username": user["username"],
            "settings": user.get("settings", {})
        }},
        upsert=True
    )

# Migrate meetings
meetings_db = client["meetings_db"]
for meeting in meetings_db.meetings.find():
    tfg_db.meetings.replace_one(
        {"_id": meeting["_id"]},
        meeting,
        upsert=True
    )

# Migrate conversations
chat_db = client["chat_db"]
for conversation in chat_db.conversations.find():
    tfg_db.conversations.replace_one(
        {"_id": conversation["_id"]},
        conversation,
        upsert=True
    )

print("Migration complete!")
```

### For Fresh Installations

If you're starting fresh or don't need to preserve existing data:
1. Drop the old databases (optional):
   ```bash
   mongosh -u <username> -p <password>
   use users_db
   db.dropDatabase()
   use meetings_db
   db.dropDatabase()
   use chat_db
   db.dropDatabase()
   ```
2. Start the application - the new collections will be created automatically

## Benefits of This Change

1. **Simplified Management**: All data in one database makes backups, monitoring, and maintenance easier
2. **Better Organization**: Clear separation of concerns through dedicated collections
3. **Improved Security**: Auth data is now in a separate collection from settings
4. **Scalability**: Easier to implement database-level operations and access controls

## Notes

- All indexes are automatically created when the application starts
- The `auth` collection stores only username and password for authentication
- The `user_settings` collection stores all user preferences and configurations
- The schema of the data within each collection remains unchanged
