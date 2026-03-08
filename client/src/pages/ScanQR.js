import { Box, Button, Paper, Typography } from "@mui/material";
import { Html5Qrcode } from "html5-qrcode";
import LZString from 'lz-string';
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getScoutMatch, submitMatch } from "../requests/ApiRequests";
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

    const tryUnpack = async (str) => {
        try {
            // 1. First, try to decompress the LZ string 
            // If it's not LZ compressed, this usually returns null or the original string
            let workingStr = str;
            try {
                const decompressed = LZString.decompressFromEncodedURIComponent(str);
                if (decompressed) workingStr = decompressed;
            } catch (lzErr) {
                console.log("Not LZ compressed, attempting raw unpack...");
            }

            // 2. Instantiate the DTO engine with our schema
            const dto = new BinaryDTO(MATCH_SCHEMA);

            // 3. Unpack the Base45 binary string
            const data = dto.unpack(workingStr);

            // 4. Reconstruct the Combined Match Key (e.g., "qm" + 4 = "qm4")
            data.matchKey = `${data.matchType}${data.matchNumber}`;

            // 5. Re-inflate the Seconds to Milliseconds for the database
            data.cycles = (data.cycles || []).map(cycle => ({
                ...cycle,
                startTime: cycle.startTime * 100,
                endTime: (cycle.startTime + cycle.duration) * 100,
            }));

            // 6. Cleanup internal-only keys used for binary efficiency
            delete data.matchType;
            delete data.matchNumber;

            console.log("Successfully Unpacked Binary:", data);

            showAlert("Getting match data (report ID and Robot");
            const res = await getScoutMatch({
                eventKey: data.eventKey,
                matchKey: data.matchKey,
                station: data.station
            });
            showAlert("Got match data");
            const reportId = res.data.reportId;
            const robot = res.data.teamNumber;

            setParsedData({ ...data, reportId, robot });
            showAlert(`Match ${data.matchKey} for Team ${data.robot} loaded!`);

        } catch (e) {
            // 7. Fallback: Check if it's a regular JSON string (for testing/legacy)
            try {
                const data = JSON.parse(str);
                setParsedData(data);
                showAlert("Loaded via JSON Fallback.");
            } catch (jsonErr) {
                console.error("Critical Unpack Error:", e);
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
                                <Typography><strong>Robot:</strong> {parsedData.robot} ({parsedData.station})</Typography>
                                <Typography><strong>Match:</strong> {parsedData.matchKey}</Typography>
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