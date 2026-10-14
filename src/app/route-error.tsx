import Button from "@/components/ui/button";
import { Home, TriangleAlert } from "lucide-react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";

/**
 * Last-resort boundary. Without it react-router renders its default developer
 * stack trace, which is not something to put in front of an operator.
 */
const RouteError = () => {
  const error = useRouteError();

  const { title, message } = isRouteErrorResponse(error)
    ? {
        title: error.status === 404 ? "Page not found" : `Error ${error.status}`,
        message:
          error.status === 404
            ? "That page does not exist. It may have been moved or the link may be wrong."
            : error.statusText || "The page could not be rendered.",
      }
    : {
        title: "Something went wrong",
        message:
          (error as Error)?.message ||
          "The page could not be rendered. Reloading usually clears it.",
      };

  return (
    <div className="min-h-svh grid place-items-center px-6 py-12 bg-base-200">
      <div className="surface shadow-md max-w-md w-full p-7 text-center">
        <div className="mx-auto mb-4 grid place-items-center size-11 rounded-full bg-error/10 border border-error/20">
          <TriangleAlert size={20} className="text-error" aria-hidden />
        </div>

        <h1 className="text-base font-semibold tracking-[-0.011em]">{title}</h1>
        <p className="text-[0.8125rem] muted mt-2 leading-relaxed break-words">
          {message}
        </p>

        <div className="flex flex-row items-center justify-center gap-2 mt-6">
          <Button size="sm" onClick={() => window.location.reload()}>
            Reload
          </Button>
          <Button size="sm" color="primary" icon={Home} href="/">
            Back to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RouteError;
