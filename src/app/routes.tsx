import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Finance App</h1>
            <p className="text-muted-foreground text-sm max-w-md">
              Ứng dụng quản lý tài chính cá nhân local-first.
            </p>
          </div>
        ),
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
