import { Box, Button, Paper, Typography } from "@mui/material";
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitMatch } from "../requests/ApiRequests";
import AppAlert from "./Common/AppAlert.js";

// --- ADD THESE IMPORTS ---
import { BinaryDTO } from "../storage/BinaryDTO";
import { MATCH_SCHEMA } from "../storage/ScoutingSchema";

const ScanQR = () => {
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const showAlert = (message) => {
        setAlertMessage(message);
        setAlertOpen(true);
    };

    const qrInstance = useRef(null);

    useEffect(() => {
        if (!qrInstance.current) {
            qrInstance.current = new Html5Qrcode("reader");
        }
        const html5QrCode = qrInstance.current;

        const stopScanner = async () => {
            if (html5QrCode && html5QrCode.isScanning) {
                try {
                    await html5QrCode.stop();
                    const readerEl = document.getElementById("reader");
                    if (readerEl) readerEl.innerHTML = "";
                } catch (err) {
                    console.error("Failed to stop scanner", err);
                }
            }
        };

        const onScanSuccess = (decodedText) => {
            console.log("Binary String Scanned:", decodedText);
            setResult(decodedText);
            stopScanner();
            tryUnpack(decodedText); // <--- Switch to the Unpacker
        };

        const startScanner = async () => {
            try {
                if (html5QrCode.isScanning) return;
                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 15, qrbox: { width: 280, height: 280 } },
                    onScanSuccess
                );
            } catch (err) {
                console.error("Scanner start error:", err);
            }
        };

        startScanner();
        return () => stopScanner();
    }, []);

    const tryUnpack = (str) => {
        try {
            // 1. Try Binary Unpacking first
            const packer = new BinaryDTO(MATCH_SCHEMA);
            const data = packer.unpack(str);
            console.log("Successfully Unpacked Binary:", data);
            setParsedData(data);
            showAlert(`Match ${data.matchKey} for Team ${data.robot} loaded!`);
        } catch (e) {
            // 2. Fallback: Check if it's a regular JSON string
            try {
                const data = JSON.parse(str);
                console.log("Successfully Parsed JSON Fallback:", data);
                setParsedData(data);
                showAlert("Loaded via JSON Fallback.");
            } catch (jsonErr) {
                console.error("Unpack Error:", e);
                showAlert("Format Error: This QR code is not recognized.");
            }
        }
    };

    const handleSubmit = async () => {
        if (!parsedData) return;
        try {
            showAlert("Submitting to Server...");
            // Map your binary object to your API's expected format
            const res = await submitMatch({
                eventKey: parsedData.eventKey || "N/A",
                matchKey: parsedData.matchKey || "N/A",
                station: parsedData.station || "N/A",
                matchData: parsedData // The whole object
            });

            if (res.status === 200) {
                showAlert("Success! Match saved to Database.");
            } else {
                showAlert("Server Error: " + res.status);
            }
        } catch (err) {
            showAlert("Network Error: Could not reach server.");
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#222", p: 2, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Paper sx={{ p: 4, bgcolor: "#333", color: "#fff", width: "100%", maxWidth: "500px", textAlign: "center" }}>
                <Typography variant="h5" mb={3}>Lead Scout Scanner</Typography>

                {!result ? (
                    <Box id="reader" sx={{ width: "100%", borderRadius: "12px", overflow: "hidden" }} />
                ) : (
                    <Box>
                        {parsedData ? (
                            <Box sx={{ textAlign: "left", bgcolor: "#111", p: 2, borderRadius: 2, mb: 2 }}>
                                <Typography><strong>Robot:</strong> {parsedData.robot}</Typography>
                                <Typography><strong>Report ID:</strong> {parsedData.reportId}</Typography>
                                <Typography><strong>Cycles:</strong> {parsedData.cycles?.length || 0}</Typography>
                                <Typography><strong>Hang:</strong> {parsedData.endgame_hangLevel}</Typography>
                            </Box>
                        ) : (
                            <Typography color="error">Invalid Data</Typography>
                        )}

                        <Button variant="contained" color="success" fullWidth onClick={handleSubmit} sx={{ mb: 1 }}>
                            Upload to Database
                        </Button>
                        <Button variant="outlined" fullWidth onClick={() => window.location.reload()}>
                            Scan Next
                        </Button>
                    </Box>
                )}
            </Paper>
            <AppAlert open={alertOpen} message={alertMessage} onClose={() => setAlertOpen(false)} />
        </Box>
    );
};

export default ScanQR;