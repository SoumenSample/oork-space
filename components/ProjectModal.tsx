"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isDark: boolean;
  children: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  isDark,
  children,
}: ModalProps)

{

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          ></div>

          {/* Modal Box */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`relative w-full max-w-lg rounded-[28px] border shadow-2xl p-6 ${
              isDark
                ? "bg-[#0F1014] border-white/10 text-white"
                : "bg-white border-rose-100 text-gray-900"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black">{title}</h2>
              <button
                onClick={onClose}
                className={`p-2 rounded-xl ${
                  isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
