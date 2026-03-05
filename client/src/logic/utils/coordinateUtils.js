export const SIDEBAR_VIRTUAL_WIDTH = 1100;

export const calculateScaledDimensions = (width, height, aspectRatio) => {
    let scaledWidth = width;
    let scaledHeight = scaledWidth / aspectRatio;
    if (scaledHeight > height) {
        scaledHeight = height;
        scaledWidth = scaledHeight * aspectRatio;
    }
    return { width: scaledWidth, height: scaledHeight };
};

export const scaleValue = (value, virtualTotal, actualTotal) => {
    return (value / virtualTotal) * actualTotal;
};
