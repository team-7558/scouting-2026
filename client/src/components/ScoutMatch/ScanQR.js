import { Box, Button, LinearProgress, Paper, Typography } from "@mui/material";
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { decompressData } from "../../logic/utils/dataCompressionUtils.js";
import { getScoutMatch, submitMatch } from "../../services/api/matchService";
import AppAlert from "../shared/AppAlert.js";

const ScanQR = () => {
    const navigate = useNavigate();

    const [scannedParts, setScannedParts] = useState({});
    const [totalParts, setTotalParts] = useState(0);
    const [result, setResult] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const showAlert = (message) => {
        setAlertMessage(message);
        setAlertOpen(true);
    };

    // useRef to hold the scanner instance
    const qrInstance = useRef(null);

    useEffect(() => {
        // Initialize the scanner instance only once
        if (!qrInstance.current) {
            qrInstance.current = new Html5Qrcode("reader");
        }
        const html5QrCode = qrInstance.current;

        const stopScanner = (spot) => {
            console.log(spot);
            // Ensure stop is only called if the scanner is active
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop()
                    .then(() => {
                        console.trace("QR Code scanner stopped successfully.");
                        // Clean the container after stopping to remove the video feed UI
                        const readerEl = document.getElementById("reader");
                        if (readerEl) {
                            readerEl.innerHTML = "";
                        }
                    })
                    .catch((err) => {
                        console.error("Failed to stop the scanner.", err);
                    });
            }
        };

        const onScanSuccess = (decodedText) => {
            // Regex for multi-part format: P1/3:data
            const multiPartMatch = decodedText.match(/^P(\d+)\/(\d+):([\s\S]*)/);

            if (multiPartMatch) {
                const partIndex = parseInt(multiPartMatch[1], 10);
                const total = parseInt(multiPartMatch[2], 10);
                const data = multiPartMatch[3];

                // Set total parts only once to trigger progress bar rendering
                if (totalParts === 0) {
                    setTotalParts(total);
                }

                setScannedParts((prev) => {
                    // Avoid re-processing the same part
                    if (prev[partIndex]) return prev;

                    const newParts = { ...prev, [partIndex]: data };
                    const currentCount = Object.keys(newParts).length;

                    console.log(`Scanned part ${partIndex}/${total}. Collected ${currentCount}`);

                    // Check if all parts have been scanned
                    if (currentCount === total) {
                        try {
                            const fullData = [];
                            for (let i = 1; i <= total; i++) {
                                fullData.push(newParts[i]);
                            }

                            const finalString = fullData.join("");
                            console.log("Multi-part scan complete. Final Result:", finalString); // Log final result

                            setResult(finalString); // Display final result
                            stopScanner(1); // Stop the scanner
                            tryParse(finalString);
                        } catch (err) {
                            console.error("Error assembling multi-part QR data:", err);
                        }
                    }
                    return newParts;
                });
            } else {
                // Handle single, non-multipart QR codes
                console.log("Single-part scan complete. Final Result:", decodedText); // Log final result
                setResult(decodedText); // Display final result
                stopScanner(2); // Stop the scanner
                tryParse(decodedText);
            }
        };

        const startScanner = async () => {
            try {
                // Prevent starting if already scanning
                if (html5QrCode.isScanning) return;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                    },
                    onScanSuccess,
                    () => { } // Optional failure callback
                );
            } catch (err) {
                console.error("Failed to start the scanner:", err);
            }
        };

        startScanner();

        // Cleanup function for when the component unmounts
        return () => {
            stopScanner(3);
        };
    }, []); // Rerun effect if totalParts changes (though it shouldn't after the first scan)

    const tryParse = async (str) => {
        try {
            console.log("str", str);
            const json = decompressData(JSON.parse(str));
            showAlert("Getting match data (report ID and Robot");
            const res = await getScoutMatch({
                eventKey: json.eventKey,
                matchKey: json.matchKey,
                station: json.station
            });
            showAlert("Got match data");
            const reportId = res.data.reportId;
            const robot = res.data.teamNumber;
            console.log("rId, robot", reportId, robot, res)
            console.log("parsed Data", { ...json, reportId, robot });
            setParsedData({ ...json.matchData, reportId, robot });
        } catch (e) {
            showAlert("Could not parse result", e);
        }
    }

    const handleSubmit = async () => {
        if (!parsedData) return;
        const { eventKey, matchKey, station, ...matchData } = parsedData;
        if (!eventKey || !matchKey || !station) {
            showAlert("Invalid QR data: Missing event/match/station info.");
            return;
        }

        //             export const submitMatch = async ({
        //   eventKey,
        //   matchKey,
        //   station,
        //   matchData,
        // }) => {

        try {
            showAlert("submitting");
            const res = await submitMatch({
                eventKey,
                matchKey,
                station,
                matchData
            });

            if (res.status === 200) {
                showAlert("Match submitted");
            } else {
                showAlert("Submission error");
                console.log(res);
            }

        } catch (err) {
            showAlert("Network error");
            console.error(err);
            console.log(err.response);
        }
    };


    const progress =
        totalParts > 0
            ? (Object.keys(scannedParts).length / totalParts) * 100
            : 0;

    if (parsedData) console.log(parsedData);

    return (
        <Box
            sx={{
                minHeight: "100vh",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#222",
                color: "#f00",
                overflowY: "auto",
                p: 2,
            }}
        >
            <Paper
                sx={{
                    p: 4,
                    bgcolor: "#333",
                    color: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    maxWidth: "90vw",
                    width: "600px",
                }}
            >
                <Typography variant="h4" gutterBottom>
                    Scan QR Code
                </Typography>

                {result ? (
                    <Box sx={{ width: "100%", wordBreak: "break-word", mt: 2 }}>
                        <Typography variant="h6" color="success.main" gutterBottom>
                            Scan Complete!
                        </Typography>

                        {parsedData ? (
                            <Paper sx={{ p: 2, bgcolor: "#111", mb: 2 }}>
                                <Typography variant="subtitle1" color="#fff">
                                    <strong>Event:</strong> {parsedData.eventKey}
                                </Typography>
                                <Typography variant="subtitle1" color="#fff">
                                    <strong>Match:</strong> {parsedData.matchKey}
                                </Typography>
                                <Typography variant="subtitle1" color="#fff">
                                    <strong>Team:</strong> {parsedData.robot} ({parsedData.station})
                                </Typography>
                                <Typography variant="subtitle1" color="#fff">
                                    <strong>Scout:</strong> {parsedData.scoutName}
                                </Typography>
                                <Typography variant="subtitle1" color="#fff">
                                    <p>{JSON.stringify(parsedData)}</p>
                                </Typography>
                            </Paper>
                        ) : (
                            <Paper sx={{ p: 2, bgcolor: "#111", maxHeight: "300px", overflow: "auto" }}>
                                <code style={{ color: "#0f0" }}>{result}</code>
                            </Paper>
                        )}

                        {parsedData && (
                            <Button
                                variant="contained"
                                color="success"
                                size="large"
                                fullWidth
                                onClick={handleSubmit}
                                sx={{ mb: 2 }}
                            >
                                Submit Match
                            </Button>
                        )}
                    </Box>
                ) : (
                    <>
                        <Box
                            id="reader"
                            sx={{
                                width: "100%",
                                borderRadius: "12px",
                                overflow: "hidden",
                            }}
                        />

                        {/* This part will now work correctly */}
                        {totalParts > 1 && (
                            <Box sx={{ width: "100%", mt: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    Progress: {Object.keys(scannedParts).length} / {totalParts} parts
                                </Typography>
                                <LinearProgress variant="determinate" value={progress} />
                            </Box>
                        )}
                    </>
                )}

                {result && <Button
                    variant="contained"
                    color="secondary"
                    sx={{ mt: 2 }}
                    onClick={() => window.location.reload()}
                >
                    Scan Another
                </Button>}
                <Button
                    variant="outlined"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={() => navigate("/")}
                >
                    Back To Home
                </Button>
            </Paper>
            <AppAlert
                open={alertOpen}
                message={alertMessage}
                onClose={() => setAlertOpen(false)}
            />
        </Box>
    );
};

export default ScanQR;