'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CoolLoaderProps {
      isDark: boolean;
      text?: string;
}

const CoolLoader: React.FC<CoolLoaderProps> = ({ isDark, text = "Optimizing your experience" }) => {
      const colors = ['#008f7a', '#4f46e5', '#f59e0b'];

      return (
            <div className="flex flex-col items-center justify-center min-h-[400px] w-full py-20">
                  <div className="flex gap-4 mb-8">
                        {colors.map((color, i) => (
                              <motion.div
                                    key={i}
                                    className="w-16 h-16 rounded-2xl shadow-xl backdrop-blur-md"
                                    style={{ backgroundColor: color }}
                                    animate={{
                                          scale: [1, 1.2, 1],
                                          rotate: [0, 90, 0],
                                          borderRadius: ["20%", "50%", "20%"],
                                    }}
                                    transition={{
                                          duration: 2,
                                          repeat: Infinity,
                                          delay: i * 0.3,
                                          ease: "easeInOut"
                                    }}
                              />
                        ))}
                  </div>
                  <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}
                  >
                        {text}
                        <motion.span
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                        >...</motion.span>
                  </motion.div>
            </div>
      );
};

export default CoolLoader;
