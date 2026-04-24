import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

// Ultra-fast, opacity-only transition. No translate to avoid layout jank
// and to make tab switches feel instantaneous.
const PageTransition = ({ children }: PageTransitionProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.12, ease: "easeOut" }}
    className="flex flex-col flex-1 min-h-0 w-full"
  >
    {children}
  </motion.div>
);

export default PageTransition;
