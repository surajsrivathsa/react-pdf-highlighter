import { viewportToScaled } from "../lib/coordinates";
import React from "react";
import {
  IHighlight,
  LTWH,
  LTWHP,
  Position,
  Scaled,
  ScaledPosition,
} from "../types";

interface HighlightLayerProps<T_HT> {
  highlightsByPage: { [pageNumber: string]: Array<T_HT> };
  pageNumber: string;
  scrolledToHighlightId: string;
  highlightTransform: (
    highlight: any,
    index: number,
    setTip: (highlight: any, callback: (highlight: any) => JSX.Element) => void,
    hideTip: () => void,
    viewportToScaled: (rect: LTWHP) => Scaled,
    screenshot: (position: LTWH) => string,
    isScrolledTo: boolean
  ) => JSX.Element;
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

export function HighlightLayer<T_HT extends IHighlight>(this: any, {
  highlightsByPage,
  scaledPositionToViewport,
  pageNumber,
  scrolledToHighlightId,
  highlightTransform,
  tip,
  hideTipAndSelection,
  viewer,
  screenshot,
  showTip,
  setState,
  currentPage,
  realPageNumber,
  pageSize,
  }: HighlightLayerProps<T_HT>) {
  
  const currentHighlights = highlightsByPage[String(realPageNumber)] || [];
  // console.log("found highlights-HighlightLayer: ", currentHighlights);
  return (
    <div>
      {currentHighlights.map(({ position, id, ...highlight }, index) => {
        // @ts-ignore
        const viewportHighlight: any = {
          id,
          position: scaledPositionToViewport(position),
          ...highlight,
        };

        if (tip && tip.highlight.id === String(id)) {
          showTip(tip.highlight, tip.callback(viewportHighlight));
        }

        const isScrolledTo = Boolean(scrolledToHighlightId === id);

        return highlightTransform(
          viewportHighlight,
          index,
          (highlight, callback) => {
            setState({
              tip: { highlight, callback },
            });

            showTip(highlight, callback(highlight));
          },
          hideTipAndSelection,
          (rect) => {
            const cutPageNumber = this.props.realPageNumber - currentPage + 1;
            
            const viewport = viewer.getPageView(
              (cutPageNumber || rect.pageNumber || parseInt(pageNumber)) - 1
            ).viewport;

            return viewportToScaled(rect, viewport);
          },
          (boundingRect) => screenshot(boundingRect, parseInt(pageNumber)),
          isScrolledTo
        );
      })}
    </div>
  );
}
