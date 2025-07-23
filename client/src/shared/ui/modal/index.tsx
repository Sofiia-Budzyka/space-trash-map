import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useLockBodyScroll } from "react-use";

import type { ModalProps } from "./types.ts";

const modalVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
};

export const Modal = ({ open, setOpen, children, onClickAway }: ModalProps) => {
    useLockBodyScroll(open);

    const modalRef = useRef<HTMLDivElement>(null);

    useClickAway(modalRef, () => {
        setOpen(false);
        onClickAway();
    });

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    ref={modalRef}
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="fixed bottom-6 left-1/2 z-50 w-11/12 -translate-x-1/2 rounded-xl bg-white shadow-xl shadow-white/20 md:w-3/12"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>,
        document.getElementById("portal")!,
    );
};
