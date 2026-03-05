import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CYCLE_TYPES, FIELD_VIRTUAL_HEIGHT, FIELD_VIRTUAL_WIDTH, PERSPECTIVE, PHASES } from "../../logic/config/gameConstants";
import { calculateScaledDimensions, scaleValue, SIDEBAR_VIRTUAL_WIDTH } from "../../logic/utils/coordinateUtils";
import { getScoutMatch } from "../../services/api/matchService";
import { getSignedInUser } from "../../services/auth/tokenService";
import { useMatchHistory } from "../hooks/useMatchHistory";

const ASPECT_RATIO = 16 / 9;

export const useScoutMatch = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [userToken, setUserToken] = useState(null);
    const [searchParamsError, setSearchParamsError] = useState(null);
    const [scoutData, setScoutData] = useState(null);
    const [matchStartTime, setMatchStartTime] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const initialMatchData = {
        phase: PHASES.PRE_MATCH,
        cycles: [],
        startingPosition: -1,
        activeCycle: {},
        defenseCycle: {},
        endgame: {
            disabled: "No",
            driverSkill: "N/A",
            defenseSkill: "N/A",
            roles: [],
            comments: "",
            shotRate: 0,
            snowballRate: 0,
            accuracy: 90,
        },
    };

    const history = useMatchHistory(initialMatchData);
    const { state, setState, reset, isUndoingRef } = history;

    // Derived State
    const { phase, cycles, startingPosition, activeCycle, defenseCycle, endgame } = state;
    const isDefending = state.defenseCycle && state.defenseCycle.startTime && !state.defenseCycle.endTime;

    // Scaling Logic
    const [scaledBoxRect, setScaledBoxRect] = useState(calculateScaledDimensions(window.innerWidth, window.innerHeight, ASPECT_RATIO));

    const updateDimensions = useCallback(() => {
        setScaledBoxRect(calculateScaledDimensions(window.innerWidth, window.innerHeight, ASPECT_RATIO));
    }, []);

    const scaleWidthToActual = useCallback((virtualValue) => {
        const virtualTotal = FIELD_VIRTUAL_WIDTH + SIDEBAR_VIRTUAL_WIDTH;
        return scaleValue(virtualValue, virtualTotal, scaledBoxRect.width);
    }, [scaledBoxRect]);

    const scaleHeightToActual = useCallback((virtualValue) => {
        return scaleValue(virtualValue, FIELD_VIRTUAL_HEIGHT, scaledBoxRect.height);
    }, [scaledBoxRect]);

    // Handlers
    const showAlert = (message) => {
        setAlertMessage(message);
        setAlertOpen(true);
    };

    const fetchScoutMatchData = useCallback(async () => {
        const eventKey = searchParams.get("eventKey");
        const station = searchParams.get("station");
        const matchKey = searchParams.get("matchKey");

        if (!eventKey || !station || !matchKey) return;

        try {
            const response = await getScoutMatch({ eventKey, station, matchKey });
            setScoutData(response.data);
            setSearchParamsError(null);
        } catch (err) {
            setSearchParamsError(err.response?.data?.message || "Failed to fetch match data");
        }
    }, [searchParams]);

    useEffect(() => {
        if (!userToken) setUserToken(getSignedInUser());
    }, []);

    useEffect(() => {
        if (!searchParams.get("eventKey") || !searchParams.get("matchKey") || !searchParams.get("station")) {
            setSearchParamsError("Missing search params");
        } else {
            fetchScoutMatchData();
        }
    }, [searchParams, fetchScoutMatchData]);

    const handleMissingParamsSubmit = (params, usedNetwork) => {
        setSearchParams({
            ...params,
            perspective: PERSPECTIVE.SCORING_TABLE_NEAR
        });
        if (!usedNetwork) {
            setScoutData({
                matchKey: params.matchKey,
                station: params.station,
                teamNumber: params.robot
            });
            localStorage.setItem("username", params.scout);
        }
        setSearchParamsError(null);
    };

    // Cycle Lifecycle Logic (Extracted from ScoutMatch.js effects)
    useEffect(() => {
        if (isUndoingRef.current) return;

        const { type, rate, startTime, endTime } = activeCycle;
        if (!type) return;

        const shouldComplete =
            ([CYCLE_TYPES.SHOOTING, CYCLE_TYPES.INTAKE, CYCLE_TYPES.SNOWBALL].includes(type) && rate !== undefined && rate !== null) ||
            (type === CYCLE_TYPES.AUTO_MOVEMENT && startTime) ||
            ([CYCLE_TYPES.CONTACT, CYCLE_TYPES.HANG].includes(type) && endTime);

        if (shouldComplete) {
            setState(prev => ({
                ...prev,
                cycles: [...prev.cycles, activeCycle],
                activeCycle: {}
            }));
        }
    }, [activeCycle, setState, isUndoingRef]);

    useEffect(() => {
        if (defenseCycle.endTime && !isUndoingRef.current) {
            setState(prev => ({
                ...prev,
                defenseCycle: {},
                cycles: [...prev.cycles, defenseCycle]
            }));
        }
    }, [defenseCycle, setState, isUndoingRef]);

    return {
        ...history,
        phase, cycles, startingPosition, activeCycle, defenseCycle, endgame,
        isDefending,
        scoutData, setScoutData,
        matchStartTime, setMatchStartTime,
        submitting, setSubmitting,
        alertOpen, setAlertOpen,
        alertMessage,
        showAlert,
        scaledBoxRect,
        updateDimensions,
        scaleWidthToActual,
        scaleHeightToActual,
        handleMissingParamsSubmit,
        searchParamsError,
        userToken,
        searchParams,
        setSearchParams,
        navigate
    };
};
