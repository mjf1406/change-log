// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    sites: i.entity({
      name: i.string(),
      slug: i.string().unique().indexed(),
      description: i.string().optional(),
      liveUrl: i.string().optional(),
      githubUrl: i.string().optional(),
      order: i.number().indexed(),
      createdAt: i.number().indexed(),
    }),
    tasks: i.entity({
      text: i.string(),
      description: i.string().optional(),
      status: i.string().indexed(),
      order: i.number().indexed(),
      createdAt: i.number().indexed(),
      startedAt: i.number().optional(),
      completedAt: i.number().indexed().optional(),
    }),
  },
  links: {
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
    siteTasks: {
      forward: {
        on: "tasks",
        has: "one",
        label: "site",
      },
      reverse: {
        on: "sites",
        has: "many",
        label: "tasks",
      },
    },
    siteLogo: {
      forward: {
        on: "sites",
        has: "one",
        label: "logo",
      },
      reverse: {
        on: "$files",
        has: "many",
        label: "sites",
      },
    },
  },
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
