import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    restoreMocks: true,
    setupFiles: "./src/test/setup-tests.ts",
    coverage: {
      provider: "v8",
      include: [
        "src/features/auth/pages/AuthPage.tsx",
        "src/features/auth/actions/logout.ts",
        "src/features/auth/lib/session.ts",
        "src/features/events/pages/{EventDetails,Events}Page.tsx",
        "src/features/events/components/EventForm.tsx",
        "src/features/newsletter/pages/NewsletterPage.tsx",
        "src/lib/api-client.ts",
        "src/features/events/lib/events-api.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
