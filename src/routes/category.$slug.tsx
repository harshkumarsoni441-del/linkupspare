// Layout: ensures /category/$slug renders nested routes via Outlet.
import { createFileRoute, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/category/$slug")({ component: () => <Outlet /> });
