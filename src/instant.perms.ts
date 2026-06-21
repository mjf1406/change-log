// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";
import { ALLOWED_EMAIL } from "./lib/auth";

const rules = {
  $users: {
    bind: { isAllowedEmail: `data.email == '${ALLOWED_EMAIL}'` },
    allow: {
      create: "isAllowedEmail",
      view: "auth.id == data.id",
      update: "auth.id == data.id",
    },
  },
  todos: {
    bind: { isAllowedUser: `auth.email == '${ALLOWED_EMAIL}'` },
    allow: {
      view: "isAllowedUser",
      create: "isAllowedUser",
      update: "isAllowedUser",
      delete: "isAllowedUser",
    },
  },
} satisfies InstantRules;

export default rules;
