import React, { useRef, useState, useEffect } from "react";

const aspectRatio = 16 / 9;

const ScaledBox = ({ children }) => {
  const scaledBoxRef = useRef(null);
  const [scaledBoxRect, setScaledBoxRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    fontSize: 0,
  });

  const getScaledBoxDimensions = () => {
    const { innerWidth, innerHeight } = window;
    let width = innerWidth;
    let height = width / aspectRatio;

    if (height > innerHeight) {
      height = innerHeight;
      width = height * aspectRatio;
    }

    return { width, height };
  };

  const resizeScaledBox = () => {
    const { width, height } = getScaledBoxDimensions();

    const rect = scaledBoxRef.current?.getBoundingClientRect() || {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };

    setScaledBoxRect({
      x: rect.left,
      y: rect.top,
      width,
      height,
      fontSize: Math.min(width, height) * 0.05,
    });
  };

  useEffect(() => {
    resizeScaledBox();
    window.addEventListener("resize", resizeScaledBox);
    return () => window.removeEventListener("resize", resizeScaledBox);
  }, []);

  return (
    <div
      ref={scaledBoxRef}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: scaledBoxRect.width,
        height: scaledBoxRect.height,
        transform: "translate(-50%, -50%)",
        background: "inherit",
        fontSize: scaledBoxRect.fontSize,
      }}
    >
      {children(scaledBoxRect)}
    </div>
  );
};

export default ScaledBox;
