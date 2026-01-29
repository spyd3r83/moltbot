export const CRON_SCHEDULE_KINDS = ["every", "at", "cron"] as const;
export type CronScheduleKind = (typeof CRON_SCHEDULE_KINDS)[number];

export const CRON_EVERY_UNITS = ["minutes", "hours", "days"] as const;
export type CronEveryUnit = (typeof CRON_EVERY_UNITS)[number];

export const CRON_SESSION_TARGETS = ["main", "isolated"] as const;
export type CronSessionTarget = (typeof CRON_SESSION_TARGETS)[number];

export const CRON_WAKE_MODES = ["next-heartbeat", "now"] as const;
export type CronWakeMode = (typeof CRON_WAKE_MODES)[number];

export const CRON_PAYLOAD_KINDS = ["systemEvent", "agentTurn"] as const;
export type CronPayloadKind = (typeof CRON_PAYLOAD_KINDS)[number];

export const CRON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Sydney",
] as const;
export type CronTimezone = (typeof CRON_TIMEZONES)[number];

export const CRON_TOOLTIPS = {
  wakeMode: {
    "next-heartbeat": "Waits for the next scheduled heartbeat check (more power-efficient)",
    now: "Immediately wakes the gateway (uses more resources)",
  },
  sessionTarget: {
    main: "Uses the main agent session (shared context)",
    isolated: "Creates a separate session with optional posting to main",
  },
  payloadKind: {
    systemEvent: "Sends a system event that can trigger workflows",
    agentTurn: "Sends a message to the agent for processing",
  },
  deliver: "Delivers the response back to the original channel",
  isolatedSession: "Creates a separate session context to avoid state pollution",
};

export const CRON_EXAMPLE_EXPRESSIONS = [
  { expr: "0 9 * * *", desc: "Every day at 9:00 AM" },
  { expr: "*/15 * * * *", desc: "Every 15 minutes" },
  { expr: "0 0 * * 0", desc: "Every Sunday at midnight" },
  { expr: "30 8 * * 1-5", desc: "Weekdays at 8:30 AM" },
  { expr: "0 12 * * *", desc: "Every day at noon" },
];
