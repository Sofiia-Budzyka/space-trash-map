import type { Dispatch, ReactNode, SetStateAction } from "react";

export type ModalProps = {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    children?: ReactNode;
    onClickAway: () => void;
};
