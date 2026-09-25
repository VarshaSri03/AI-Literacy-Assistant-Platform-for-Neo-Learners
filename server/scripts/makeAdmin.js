// server/scripts/makeAdmin.js
//
// Two modes:
//
//   node scripts/makeAdmin.js
//     -> lists every user and their CURRENT role, so you can see exactly
//        what's actually stored in the database right now (no guessing).
//
//   node scripts/makeAdmin.js <username-or-email>
//     -> promotes that one account to role: "admin" and prints
//        confirmation you can double-check.
//
// Run from the server/ folder — needs the same MONGODB_URI as your .env.

import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

const identifier = process.argv[2];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  if (!identifier) {
    const users = await User.find({}, "username email role isActive").lean();
    if (!users.length) {
      console.log("No users found at all — the database is empty, or MONGODB_URI points at the wrong database.");
    } else {
      console.log(`Found ${users.length} user(s):\n`);
      users.forEach((u) => {
        console.log(`  username: ${u.username.padEnd(20)} email: ${(u.email || "").padEnd(28)} role: ${u.role}  active: ${u.isActive !== false}`);
      });
      console.log(`\nRun again as: node scripts/makeAdmin.js <one-of-the-usernames-above>`);
    }
    process.exit(0);
  }

  const user = await User.findOne({
    $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
  });

  if (!user) {
    console.error(`No user found matching "${identifier}". Run "node scripts/makeAdmin.js" with no arguments to see the exact usernames that exist.`);
    process.exit(1);
  }

  user.role = "admin";
  await user.save();

  const check = await User.findById(user._id).lean();
  console.log(`✅ Saved. ${check.name} (@${check.username}) now has role: "${check.role}" in the database.`);
  console.log(`Log in with that exact username/email and password — you should land on the admin dashboard.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Script failed:", err.message);
  process.exit(1);
});
