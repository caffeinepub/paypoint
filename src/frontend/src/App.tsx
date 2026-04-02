import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { AppFooter } from "./components/AppFooter";
import { AppHeader } from "./components/AppHeader";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useIsAdmin,
  useIsRegistered,
} from "./hooks/useQueries";
import { ActivityPage } from "./pages/ActivityPage";
import { AdminPage } from "./pages/AdminPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { MyQRCodePage } from "./pages/MyQRCodePage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { ScanPayPage } from "./pages/ScanPayPage";

// ---- Auth Guard Layout ----
function AppShell() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const profileQuery = useGetCallerUserProfile();
  const registeredQuery = useIsRegistered();
  const adminQuery = useIsAdmin();

  const navigate = useNavigate();
  const location = useLocation();

  const userProfile = profileQuery.data ?? null;
  const isAdmin = adminQuery.data ?? false;

  const isProfileLoading =
    isInitializing || profileQuery.isLoading || registeredQuery.isLoading;

  const showRegister =
    isAuthenticated &&
    !isProfileLoading &&
    profileQuery.isFetched &&
    registeredQuery.data === false;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isInitializing && !isAuthenticated && location.pathname !== "/login") {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isInitializing, navigate, location.pathname]);

  // Show loading state
  if (isInitializing || (isAuthenticated && isProfileLoading)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.15 0.07 243) 0%, oklch(0.22 0.07 243) 100%)",
        }}
      >
        <div className="space-y-4 w-64" data-ocid="app.loading_state">
          <Skeleton className="h-10 w-full bg-white/10" />
          <Skeleton className="h-6 w-3/4 bg-white/10" />
          <Skeleton className="h-6 w-1/2 bg-white/10" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (showRegister) {
    return (
      <RegisterPage
        onRegistered={() => {
          registeredQuery.refetch();
          profileQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader userProfile={userProfile} isAdmin={isAdmin} />
      <div className="flex-1">
        <Outlet />
      </div>
      <AppFooter />
    </div>
  );
}

// ---- Routes ----
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors closeButton position="top-right" />
    </>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => {
    const { identity, isInitializing } = useInternetIdentity();
    const navigate = useNavigate();
    useEffect(() => {
      if (!isInitializing && identity) {
        navigate({ to: "/" });
      }
    }, [identity, isInitializing, navigate]);
    return <LoginPage />;
  },
});

const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "shell",
  component: AppShell,
});

const dashboardRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/",
  component: () => {
    const profileQuery = useGetCallerUserProfile();
    return <DashboardPage userProfile={profileQuery.data ?? null} />;
  },
});

const scanRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/scan",
  component: ScanPayPage,
});

const qrRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/qr",
  component: MyQRCodePage,
});

const activityRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/activity",
  component: ActivityPage,
});

const profileRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/profile",
  component: () => {
    const profileQuery = useGetCallerUserProfile();
    return <ProfilePage userProfile={profileQuery.data ?? null} />;
  },
});

const adminRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/admin",
  component: AdminPage,
});

const router = createRouter({
  routeTree: rootRoute.addChildren([
    loginRoute,
    shellRoute.addChildren([
      dashboardRoute,
      scanRoute,
      qrRoute,
      activityRoute,
      profileRoute,
      adminRoute,
    ]),
  ]),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
