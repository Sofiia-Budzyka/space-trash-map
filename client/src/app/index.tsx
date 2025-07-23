import { QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import { queryClient } from "@/shared/api";
import { ThemeProvider } from "@/shared/ui";

import "./index.css";
import { router } from "./router";

if (import.meta.env.DEV) {
    const { worker } = await import("../../mocks/browser");
    await worker.start();
}

const root = document.querySelector("#root")!;

createRoot(root).render(
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    </ThemeProvider>,
);
