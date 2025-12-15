"use client";

import { Dialog, Transition } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Fragment } from "react";
import { cn } from "@/shared/utils/cn";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}: ModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <Dialog as="div" className="relative z-50" onClose={onClose} open>
        <motion.div
          className="fixed inset-0 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition
              show={isOpen}
              as={Fragment}
              enter="transform transition duration-300"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="transform transition duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Panel
                className={cn(
                  "w-full max-w-lg rounded-3xl border border-neutral-100 bg-white p-6 shadow-elevated",
                  className,
                )}
              >
                <div className="flex items-start justify-between gap-6">
                  {title && (
                    <Dialog.Title className="text-lg font-semibold text-neutral-900">
                      {title}
                    </Dialog.Title>
                  )}
                  <button
                    onClick={onClose}
                    className="rounded-full bg-neutral-100 p-2 text-neutral-500 transition hover:bg-neutral-200"
                    aria-label="Закрыть"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4">{children}</div>
              </Dialog.Panel>
            </Transition>
          </div>
        </div>
      </Dialog>
    )}
  </AnimatePresence>
);

