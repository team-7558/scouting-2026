import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
} from "@mui/material";

const FullscreenDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(true);

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setOpen(true);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleFullscreenRequest = () => {
    const element = document.documentElement;
    element.requestFullscreen?.() ||
      element.mozRequestFullScreen?.() ||
      element.webkitRequestFullscreen?.() ||
      element.msRequestFullscreen?.();
    setOpen(false);
  };

  return (
    <Dialog open={open} aria-labelledby="fullscreen-dialog-title">
      <DialogContent>This page requires fullscreen.</DialogContent>
      <DialogActions>
        <Button onClick={handleFullscreenRequest} color="primary" autoFocus>
          Go
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FullscreenDialog;
