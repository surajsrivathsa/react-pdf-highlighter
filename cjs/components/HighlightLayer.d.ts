import React from "react";
import { IHighlight, LTWH, LTWHP, Position, Scaled, ScaledPosition } from "../types";
interface HighlightLayerProps<T_HT> {
    highlightsByPage: {
        [pageNumber: string]: Array<T_HT>;
    };
    pageNumber: string;
    scrolledToHighlightId: string;
    highlightTransform: (highlight: any, index: number, setTip: (highlight: any, callback: (highlight: any) => JSX.Element) => void, hideTip: () => void, viewportToScaled: (rect: LTWHP) => Scaled, screenshot: (position: LTWH) => string, isScrolledTo: boolean) => JSX.Element;
    tip: {
        highlight: any;
        callback: (highlight: any) => JSX.Element;
    } | null;
    scaledPositionToViewport: (scaledPosition: ScaledPosition) => Position;
    hideTipAndSelection: () => void;
    viewer: any;
    screenshot: (position: LTWH, pageNumber: number) => string;
    showTip: (highlight: any, content: JSX.Element) => void;
    setState: (state: any) => void;
    currentPage: number;
    realPageNumber: number;
    pageSize: number;
}
export declare function HighlightLayer<T_HT extends IHighlight>(this: any, { highlightsByPage, scaledPositionToViewport, pageNumber, scrolledToHighlightId, highlightTransform, tip, hideTipAndSelection, viewer, screenshot, showTip, setState, currentPage, realPageNumber, pageSize, }: HighlightLayerProps<T_HT>): React.JSX.Element;
export {};
