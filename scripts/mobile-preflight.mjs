import { spawnSync } from "node:child_process";
import { ensureMobileNode } from "./mobile-node.mjs";

ensureMobileNode();

const steps = [
  ["mobile doctor", "npm", ["run", "mobile:doctor"]],
  ["TypeScript", "npx", ["tsc", "-p", "tsconfig.app.json", "--noEmit"]],
  [
    "targeted tests",
    "npm",
    [
      "test",
      "--",
      "--run",
      "src/test/databaseContracts.test.ts",
      "src/test/matchService.test.ts",
      "src/test/chatTrade.test.ts",
      "src/test/tradeFlow.test.ts",
      "src/test/matchConversationNavigation.test.ts",
      "src/test/conversationOrdering.test.ts",
      "src/test/conversationPreview.test.ts",
      "src/test/itemService.test.ts",
      "src/test/proposals.test.ts",
      "src/test/notifications.test.ts",
      "src/test/ratings.test.ts",
      "src/test/searchService.test.ts",
      "src/test/mobileKeyboardSafeArea.test.tsx",
      "src/test/itemMediaActions.test.tsx",
      "src/test/share.test.ts",
      "src/test/mediaFrame.test.ts",
      "src/test/pullToRefresh.test.ts",
      "src/test/messageDeliveryStatus.test.ts",
    ],
  ],
  ["remote DB contracts", "npm", ["run", "db:contracts"]],
];

for (const [label, cmd, args] of steps) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(cmd, args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    console.error(`\nFAIL: ${label}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nOK: mobile preflight passed.");
