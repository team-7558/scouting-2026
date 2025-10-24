import { Slider } from "@mui/material";
import { COLORS } from "./Constants";

export const ImageIcon = (imageSrc) => (
  <span
    style={{
      display: "block",
      overflow: "hidden",
      pointerEvents: "none",
    }}
  >
    <img
      src={imageSrc}
      style={{
        display: "block",
        objectFit: "cover",
        height: "100%",
        width: "100%",
        pointerEvents: "none",
      }}
    />
  </span>
);

export const StartingPositionSlider = (match) => {
  const flipSlider = match.isScoutingRed == match.isScoringTableFar;

  return (
    <Slider
      orientation="vertical"
      value={match.startingPosition * (flipSlider ? -1 : 1)}
      onChange={(event, value) => match.setStartingPosition(Math.abs(value))}
      min={flipSlider ? -13 : 1}
      max={flipSlider ? -1 : 13}
      step={1}
      valueLabelDisplay="on"
      valueLabelFormat={(value) => <div>{match.scoutData?.teamNumber}</div>}
      sx={{
        transform: flipSlider
          ? ""
          : `translateY(${match.fieldCanvasRef.current?.scaleHeightToActual(
              -300
            )}px)`,
        marginTop: `${match.fieldCanvasRef.current?.scaleHeightToActual(
          150
        )}px`,
        marginBottom: `${match.fieldCanvasRef.current?.scaleHeightToActual(
          150
        )}px`,
        padding: 0,
        "& .MuiSlider-thumb": {
          // backgroundImage: `url("https://i.imgur.com/TqGjfyf.jpg")`,
          width: match.fieldCanvasRef.current?.scaleWidthToActual(300) || 0,
          height: match.fieldCanvasRef.current?.scaleHeightToActual(300) || 0,
          margin: 0,
          backgroundPosition: "center",
          backgroundSize: "cover",
          borderRadius: 0,
        },
        "& .MuiSlider-track": {
          color: match.startingPosition == -1 ? COLORS.DISABLED : COLORS.ACTIVE,
        },
        "& .MuiSlider-rail": {
          color: match.startingPosition == -1 ? COLORS.DISABLED : COLORS.ACTIVE,
        },
      }}
    />
  );
};