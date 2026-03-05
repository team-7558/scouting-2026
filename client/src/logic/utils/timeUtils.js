export const formatMatchTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(1, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const calculateTimeLeft = (phase, matchStartTime, phasesConfig, currentTime = Date.now()) => {
    if (!matchStartTime) return null;
    const elapsed = currentTime - matchStartTime;
    const maxTime = phase === 'auto' ? phasesConfig.AUTO_MAX_TIME : phasesConfig.TELE_MAX_TIME;
    return Math.max(0, maxTime - elapsed);
};
