/*
 * Nocturne Mail / App shell
 * Nocturne Flow — warm-light surfaces, consistent geometry,
 * content-led hierarchy, and purposeful motion.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import FlowHome from "./pages/FlowHome";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="bottom-right" />
          <FlowHome />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
