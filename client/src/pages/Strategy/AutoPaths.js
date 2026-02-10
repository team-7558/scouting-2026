import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import {
    Typography,
    Container,
    CircularProgress,
    Box,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip, // <-- Import Tooltip
    TextField,
    InputAdornment,
    Chip,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider,
    Card,
    CardHeader,
    CardContent,
    Grid,
    Autocomplete,

} from '@mui/material';
import { getReports } from '../../requests/ApiRequests';
import RequiredParamsDialog from '../Common/RequiredParamsDialog';
import fullField from '../../assets/scouting-2025/field/full_field.png'; // <-- Using your direct import
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from '@mui/icons-material/Clear';
import { styled } from '@mui/material/styles';
import HomeIcon from "@mui/icons-material/Home";

const accentColor = "#1fdb25";

// ================================
// CONFIG: Path and Field Constants
// YOU WILL LIKELY NEED TO EDIT THESE VALUES
// ================================

const CYCLE_COLORS = {
    AUTO_MOVEMENT: '#1fdb25', // Green
    SHOOT: '#fa1919',         // Red
    SNOWBALL: '#fa1919',      // Red
    INTAKE: '#3ad5fc',        // Blue
    DEFAULT: '#cccccc',       // Grey for any other type
};

// These are example coordinates. YOU MUST UPDATE these to match your game's field layout.
// The coordinate system is based on the SVG viewBox (e.g., 54 units wide, 27 units high).
const FIELD_WAYPOINTS = {
    CLOSE: { x: 10, y: 13.2 },
    // BUMP_R: { x: 40, y: 15 },
    BUMP_L: { x: 15, y: 8 },
    TRENCH_R: { x: 15, y: 25 },
    TRENCH_L: { x: 15, y: 1 },
    FAR: { x: 6, y: 20 },
    LEVEL_1: { x: 1, y: 14.8 },
    LEVEL_2: { x: 1, y: 14.8 },
    LEVEL_3: { x: 1, y: 14.8 },
    DEPOT: { x: 1, y: 7 },
};

const RenderTopBar = ({
    matchKeySearchTerm,
    robotSearchTerm,
    setMatchKeySearchTerm,
    setRobotSearchTerm,
    searchParams,
}) => {
    const navigate = useNavigate();
    const requiredParamKeys = ['eventKey'];
    return (
        <Paper
            sx={{
                zIndex: 2,
                p: 2,
                pb: 0,
                mb: 3,
                backgroundColor: "#121212",
                border: "1px solid #333",
                // boxShadow: `0px 0px 10px ${accentColor}`
                boxShadow: `0px 0px 10px #eee`
            }}
        >
            <HomeIcon
                sx={{ aspectRatio: "1/1", marginBottom: "-10%", zIndex: 5, cursor: "pointer", margin: "0px", fontSize: "30px", color: "white" }}
                onClick={() => {
                    navigate("/");
                }}
            />
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2
                }}
            >
                <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <Typography variant="h2" sx={{ mb: { xs: 2, sm: 0 }, color: accentColor, textAlign: "center" }}>
                        Team Reports
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-evenly" }}>
                        {requiredParamKeys.map((key) => (
                            <Chip
                                key={key}
                                label={`${key}: ${searchParams.get(key)}`}
                                sx={{ backgroundColor: "#888", color: "#000" }}
                            />
                        ))}
                    </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" }, alignItems: "center", height: "100%" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-evenly", height: "100%", flexDirection: { sm: "column", xs: "row" }, alignItems: "center" }}>
                        <Button
                            variant="outlined"
                            onClick={() => window.location.reload()}
                            size="large"
                            sx={{
                                borderRadius: "0.7vw",
                                border: "2px solid " + accentColor,
                                color: "#ddd",
                                "&:hover": { backgroundColor: "#009933" },
                                height: { xs: "50px", sm: "75px", md: "50px" },
                                margin: { xs: "1vh 5vw", sm: "1vh 1vw" },
                                width: { xs: "30vw", sm: "10vw" },
                                fontSize: 'calc(0.5vw + 7px)'
                            }}
                        >
                            RELOAD
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={() => {
                                window.location.pathname = "/categorySort"
                            }}
                            sx={{
                                borderRadius: "0.7vw",
                                border: `2px solid ${accentColor}`,
                                color: "#ddd",
                                "&:hover": { backgroundColor: "#009933" },
                                height: { xs: "50px", sm: "75px", md: "50px" },
                                margin: { xs: "1vh 5vw", sm: "1vh 1vw" },
                                width: { xs: "30vw", sm: "10vw" },
                                fontSize: 'calc(0.5vw + 7px)'
                            }}
                        >
                            ALL DATA
                        </Button>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: { xs: "row", sm: "column" }, justifyContent: "center", alignItems: "center" }}>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const url = new URL(window.location.href);
                                url.pathname = "/matches";
                                url.searchParams.set("matchKey", matchKeySearchTerm);
                                window.history.replaceState({}, "", url.toString());
                                window.location.href = window.location.href;
                            }}
                        >
                            <TextField
                                value={matchKeySearchTerm}
                                onChange={(e) => setMatchKeySearchTerm(e.target.value.toLowerCase())}
                                variant="outlined"
                                size="large"
                                placeholder="Search by match key"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <SearchIcon sx={{ color: accentColor }} />
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ width: { xs: "100%", sm: "20vw" }, bgcolor: "#222", input: { color: "#fff", fontSize: 'calc(0.7vw + 10px)' }, borderRadius: "10000px" }}
                            />
                        </form>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const url = new URL(window.location.href);
                                url.pathname = "/robots";
                                setRobotSearchTerm(prevTerm => {
                                    console.log("rst", prevTerm);
                                    url.searchParams.set("robot", prevTerm.join(","));
                                    console.log("here", url.href);
                                    window.location.href = url.href;
                                    return prevTerm;
                                })
                            }}
                            id="robotsForm"
                        >
                            <Autocomplete
                                multiple
                                freeSolo
                                options={[]}
                                value={Array.isArray(robotSearchTerm)
                                    ? robotSearchTerm
                                    : [robotSearchTerm]
                                }
                                onChange={(event, newValue) => {
                                    console.log("abc", newValue.filter(v => v));
                                    setRobotSearchTerm(newValue.filter(Boolean));
                                    const form = document.getElementById("robotsForm");
                                    const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
                                    form.dispatchEvent(submitEvent);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        variant="outlined"
                                        size="large"
                                        placeholder="Search by robots"
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <SearchIcon sx={{ color: accentColor }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            width: { xs: "100%", sm: "20vw" },
                                            bgcolor: "#222",
                                            input: { color: "#fff" },
                                            mt: { sm: "1vh", xs: 0 },
                                            borderRadius: "500px",
                                            fontSize: 'calc(0.7vw + 10px)'
                                        }}
                                    />
                                )}
                                renderTags={(value, getItemProps) =>
                                    value.map((option, index) => {
                                        const { key, ...itemProps } = getItemProps({ index });
                                        console.log("i", index);
                                        return (
                                            <Chip
                                                variant="outlined"
                                                label={option}
                                                key={key}
                                                size="large"
                                                sx={{ color: "#bbb", fontSize: 'calc(0.5vw + 7px)' }}
                                                {...itemProps}
                                                deleteIcon={<ClearIcon style={{ color: '#aaa', fontSize: '2vw' }}
                                                />}
                                            />
                                        );
                                    })
                                }
                            />
                        </form>
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
}

// The field width and height in your chosen units (e.g., feet) for the viewBox.
const FIELD_WIDTH = 54;
const FIELD_HEIGHT = 27;

// This scales the starting position number (0-10) across the width of the field.
const STARTING_POSITION_SCALE_FACTOR = FIELD_WIDTH / 27;
// The starting Y-coordinate for the robot. Adjust as needed.
const STARTING_X_POSITION = 13;

const DEFAULT_UNKNOWN_LOCATION = { x: 2, y: 25 };

// ================================
// Main Component
// ================================
const AutoPathVisualizer = ({ requiredParamKeys = ['eventKey'] }) => {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const [paramsProvided, setParamsProvided] = useState(false);
    const [allReports, setAllReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [selectedRobot, setSelectedRobot] = useState('');
    const [selectedMatchKey, setSelectedMatchKey] = useState('');

    // Check for required URL params
    useEffect(() => {
        const allProvided = requiredParamKeys.every(
            (key) => searchParams.get(key) && searchParams.get(key).trim() !== ''
        );
        setParamsProvided(allProvided);
    }, [location.search, searchParams, requiredParamKeys]);

    // Fetch all report data when params are provided
    useEffect(() => {
        const fetchAllReports = async () => {
            if (!paramsProvided) return;

            setLoading(true);
            setError('');
            try {
                const params = {};
                requiredParamKeys.forEach((key) => {
                    params[key] = searchParams.get(key);
                });
                const res = await getReports(params);
                console.log(res.data);
                setAllReports(res.data.reports || []);
            } catch (err) {
                console.error('Error fetching reports:', err);
                setError('Failed to load report data.');
            } finally {
                setLoading(false);
            }
        };

        fetchAllReports();
    }, [paramsProvided]);

    const handleDialogSubmit = (values) => {
        const currentParams = {};
        for (const key of searchParams.keys()) {
            currentParams[key] = searchParams.get(key);
        }
        setSearchParams({ ...currentParams, ...values });
    };

    const uniqueRobots = useMemo(() => Array.from(new Set(allReports.map((r) => r.robot))).sort(), [allReports]);
    const matchesForSelectedRobot = useMemo(() =>
        allReports.filter((r) => r.robot === selectedRobot).map((r) => r.match_key),
        [allReports, selectedRobot]
    );
    const selectedReport = useMemo(() =>
        allReports.find((r) => r.robot === selectedRobot && r.match_key === selectedMatchKey),
        [allReports, selectedRobot, selectedMatchKey]
    );

    function cubicSegmentCatmullRom(points, i, handleScale) {
        const n = points.length;
        if (i < 0 || i >= n - 1) {
            throw new Error("Index must be between 0 and points.length - 2");
        }

        const p0 = points[Math.max(i - 1, 0)];       // previous (or clamp)
        const p1 = points[i];                        // current
        const p2 = points[i + 1];                    // next
        const p3 = points[Math.min(i + 2, n - 1)];   // next-next (or clamp)

        // Tangent at p1 and p2 approximated from neighbors
        const t1x = (p2.x - p0.x) * handleScale;
        const t1y = (p2.y - p0.y) * handleScale;
        const t2x = (p3.x - p1.x) * handleScale;
        const t2y = (p3.y - p1.y) * handleScale;

        // Control points
        const c1 = {
            x: p1.x + t1x,
            y: p1.y + t1y
        };

        const c2 = {
            x: p2.x - t2x,
            y: p2.y - t2y
        };

        // Cubic Bézier from p1 to p2
        return `C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
    }

    // Core logic to generate a list of renderable nodes for the path
    const autoPathNodes = useMemo(() => {
        if (!selectedReport || !selectedReport.cycles) return [];

        const autoCycles = selectedReport.cycles
            .filter((cycle) => cycle.phase === 'auto')
            .sort((a, b) => a.cycle_index - b.cycle_index);

        const nodes = [];
        // Start with a null last known point. It will be set by the first valid location.
        let lastKnownPoint = null;

        for (const cycle of autoCycles) {
            const cycleType = cycle.type || 'DEFAULT';
            const color = CYCLE_COLORS[cycleType] || CYCLE_COLORS.DEFAULT;

            let pointForThisCycle = null;
            let locationForTooltip = `Unknown Location ${cycle.location}`;
            let isMovementEvent = false;

            // Step 1: Try to parse a valid location from the cycle data
            if (cycle.location) {
                const locationStr = String(cycle.location).replace(/"/g, '');
                let parsedPoint = null;

                if (FIELD_WAYPOINTS[locationStr]) {
                    parsedPoint = FIELD_WAYPOINTS[locationStr];
                } else if (!isNaN(Number(locationStr))) {
                    parsedPoint = {
                        y: Number(locationStr) * STARTING_POSITION_SCALE_FACTOR,
                        x: STARTING_X_POSITION,
                    };
                }

                // If we successfully got a coordinate, use it.
                if (parsedPoint) {
                    pointForThisCycle = parsedPoint;
                    locationForTooltip = locationStr;
                    // THIS IS KEY: Only update the robot's actual position with valid data
                    lastKnownPoint = parsedPoint;
                    if (cycleType === 'AUTO_MOVEMENT') {
                        isMovementEvent = true;
                    }
                }
            }

            // Step 2: If we couldn't parse a location, decide where to plot the node.
            if (pointForThisCycle === null) {
                // If the action is a movement with no location, we must skip it.
                if (cycleType === 'AUTO_MOVEMENT') {
                    continue;
                }
                // For any other action (SHOOT, INTAKE, etc.) with no location...
                // plot it at the designated "unknown" spot.
                pointForThisCycle = DEFAULT_UNKNOWN_LOCATION;
            }

            // Step 3: Add the node to our list for rendering.
            nodes.push({
                point: pointForThisCycle,
                type: cycleType,
                color: color,
                isMovement: isMovementEvent,
                location: locationForTooltip,
                id: cycle.key || `node-${nodes.length}`
            });
        }
        return nodes;
    }, [selectedReport]);

    const [matchKeySearchTerm, setMatchKeySearchTerm] = useState("");
    const [robotSearchTerm, setRobotSearchTerm] = useState([]);


    const renderContent = () => {
        if (loading) return <CircularProgress />;
        if (error) return <Typography color="error">{error}</Typography>;
        if (allReports.length === 0) return <Typography sx={{ color: '#888' }}>No reports found for the given parameters.</Typography>;

        const handleScale = 0.2; // or from props/state

        const points = autoPathNodes.map(n => n.point);

        const d =
            points.length > 0
                ? [
                    `M ${points[0].x} ${points[0].y}`,
                    ...points.slice(0, -1).map((_, i) =>
                        cubicSegmentCatmullRom(points, i, handleScale)
                    ),
                ].join(" ")
                : "";

        return (
            <>
                {/* Filters */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel sx={{ color: '#ccc' }}>Robot</InputLabel>
                        <Select value={selectedRobot} label="Robot" onChange={(e) => { setSelectedRobot(e.target.value); setSelectedMatchKey(''); }} sx={{ color: '#eee', border: `2px solid #ccc`, svg: { color: '#ccc' } }}>
                            {uniqueRobots.map((robotId) => <MenuItem key={robotId} value={robotId}>{robotId}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 150 }} disabled={!selectedRobot}>
                        <InputLabel sx={{ color: '#ccc' }}>Match</InputLabel>
                        <Select value={selectedMatchKey} label="Match" onChange={(e) => setSelectedMatchKey(e.target.value)} sx={{ color: '#eee', border: `2px solid #ccc`, svg: { color: '#ccc' } }}>
                            {matchesForSelectedRobot.map((matchKey) => <MenuItem key={matchKey} value={matchKey}>{matchKey}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>

                {/* Visualizer */}
                <Box sx={{ position: 'relative', width: '100%', maxWidth: '1000px', margin: '0 auto', paddingTop: `${(FIELD_HEIGHT / FIELD_WIDTH) * 100}%`, overflow: 'hidden' }}>
                    <Box component="img" src={fullField} alt="Field Diagram" sx={{ position: 'absolute', top: "-5%", left: "-5.5%", width: '110%', height: '110%', objectFit: 'contain' }} />
                    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}>
                        {/* Render path segments */}
                        {points.length > 1 && (
                            <path
                                d={d}
                                fill="none"
                                stroke={autoPathNodes[0].color}
                                strokeWidth="0.2"
                            />
                        )}

                        {/* Render circles for each event node on top of the lines */}
                        {autoPathNodes.map((node) => {
                            const isAction = !node.isMovement;
                            return (
                                <Tooltip title={node.location} key={`tooltip-${node.id}`} arrow>
                                    <circle
                                        cx={node.point.x} cy={node.point.y}
                                        r={isAction ? "0.6" : "0.4"}
                                        fill={node.color}
                                        stroke={isAction ? "white" : "none"}
                                        strokeWidth={isAction ? "0.1" : "0"}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </Tooltip>
                            );
                        })}
                    </svg>
                </Box>

                {/* Legend */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 3, mt: 4 }}>
                    {Object.entries(CYCLE_COLORS).map(([type, color]) => (
                        <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 20, height: 20, backgroundColor: color, borderRadius: '4px', border: '1px solid #555' }} />
                            <Typography sx={{ color: '#ccc' }}>{type.replace('_', ' ')}</Typography>
                        </Box>
                    ))}
                </Box>

                {!autoPathNodes.length && selectedMatchKey && <Typography sx={{ color: '#888', textAlign: 'center', mt: 4 }}>No autonomous path data found for this match.</Typography>}
            </>
        );
    };

    return (
        <Container maxWidth="xl" sx={{ color: '#E0E0E0', py: 3 }}>
            <RenderTopBar
                matchKeySearchTerm={matchKeySearchTerm}
                robotSearchTerm={robotSearchTerm}
                setMatchKeySearchTerm={setMatchKeySearchTerm}
                setRobotSearchTerm={setRobotSearchTerm}
                searchParams={searchParams}
            />
            <Paper sx={{ bgcolor: '#111', width: '100%', padding: '2vh 2vw', boxShadow: `0px 0px 10px #aaa` }}>
                <Typography variant="h4" sx={{ color: '#ccc', mb: 3 }}>
                    Autonomous Path Visualizer
                </Typography>
                {paramsProvided ? renderContent() : (
                    <RequiredParamsDialog
                        key="required-params-dialog"
                        open={!paramsProvided}
                        onSubmit={handleDialogSubmit}
                        searchParams={searchParams}
                        searchParamsError=""
                        requiredParamKeys={requiredParamKeys}
                    />
                )}
            </Paper>
        </Container>
    );
};

export default AutoPathVisualizer;