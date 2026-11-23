"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { AnimationStyleOption } from "@/types/database";

const HEART_SEEDS = [
  { id: 1, left: "8%", delay: 0, duration: 14, size: 16, opacity: 0.2 },
  { id: 2, left: "22%", delay: 3, duration: 18, size: 12, opacity: 0.16 },
  { id: 3, left: "41%", delay: 6, duration: 15, size: 18, opacity: 0.18 },
  { id: 4, left: "63%", delay: 2, duration: 17, size: 14, opacity: 0.17 },
  { id: 5, left: "78%", delay: 5, duration: 13, size: 20, opacity: 0.15 },
  { id: 6, left: "91%", delay: 1, duration: 16, size: 13, opacity: 0.2 },
];

export function FloatingHearts({
  style = "gentle",
}: {
  style?: AnimationStyleOption;
}) {
  if (style === "minimal") return null;

  const hearts = style === "playful" ? HEART_SEEDS : HEART_SEEDS.slice(0, 4);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          initial={{ y: "105vh", x: 0, opacity: 0 }}
          animate={{
            y: "-12vh",
            x: [0, 16, -12, 8, 0],
            opacity: [0, h.opacity, h.opacity, 0],
          }}
          transition={{
            duration: style === "playful" ? h.duration * 0.78 : h.duration,
            delay: h.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ left: h.left }}
          className="absolute bottom-0 text-brand-rose"
        >
          <Heart size={h.size} fill="currentColor" />
        </motion.div>
      ))}
    </div>
  );
}
