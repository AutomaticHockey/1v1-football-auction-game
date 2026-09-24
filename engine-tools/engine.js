/* ENGINE: Cornerstone (D:\NFL game test, src/core @ 4ffc55b) compiled with this game's driver. Built by engine-tools/build.mjs; do not edit here. */
var ENGINE = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // game.ts
  var game_exports = {};
  __export(game_exports, {
    NEUTRAL_WEATHER: () => NEUTRAL_WEATHER,
    TUNING: () => TUNING,
    configure: () => configure,
    cornerstoneSimulateGame: () => simulateGame,
    createGame: () => createGame,
    mulberry32: () => mulberry32,
    playOvertimePeriod: () => playOvertimePeriod,
    playQuarter: () => playQuarter,
    playerStatLines: () => playerStatLines,
    simulateGame: () => simulateGame2
  });

  // hooks.ts
  var HOOKS = { game: null };

  // cornerstone/tuning.ts
  var TUNING = { "clock": { "secondsPerSnap": 28.7, "playClockNormal": 40, "normalRunoff": 35.3, "hurryUpRunoff": 20, "mediumRunoff": 33, "drainClockRunoff": 40, "noHuddleRunoff": 26, "penaltyRunoff": 9, "snapToWhistleMin": 4, "snapToWhistleMax": 7, "fieldGoalSeconds": 5, "puntSeconds": 7, "kickoffSeconds": 6, "lateGameSeconds": 300, "overtimeHurryClock": 300, "halfDefenseTimeoutChance": 0.33, "halfOffenseTimeoutChance": 0.25, "hurryOffenseTimeoutChance": 0.85, "lateDefenseTimeoutChance": 0.9, "ordinaryTimeoutRate": 0.03, "offenseTimeoutShare": 0.66, "kneelSeconds": 33, "halfKneelClock": 15, "halfKneelYardLine": 50, "spikeClock": 60, "spikeChance": 0.44, "spikeSeconds": 2 }, "coach": { "passPlayShare": 0.5732, "profileSd": 0.055, "neutral": 0.5, "shortThirdDown": 2, "drainLead": 8, "kickRangeYardLine": 65, "twoScoreHurryClock": 600, "lateQuarter": 3, "urgencyFourthQuarter": 1, "urgencyThirdQuarter": 0.5, "urgencyCloseDeficit": 8, "urgencyBase": 0.1, "urgencyMid": 0.5, "urgencyHigh": 0.85, "urgencyOvertimeTied": 0.9, "forceBallClock": 30, "forceBallDeficit": 8, "riskScale": 100, "maxReadsTrusted": 4, "maxReadsSimple": 2, "trustReads": 0.7, "desperateDistance": 10, "desperateRiskBonus": 20, "redZoneRiskPenalty": 10, "lateDeficit": 8, "turboTempo": 100, "drainTempo": 10, "noHuddleRate": 0.069, "noHuddleTempoLogit": 0.5, "hurryNoHuddleShare": 0.32, "weightScale": 10, "aggressionDeepScale": 1, "conservativeThreshold": 0.4, "conservativeSafeBonus": 2, "conservativeDeepPenalty": 3, "lowTrustThreshold": 0.4, "lowTrustMediumPenalty": 1, "lowTrustScreenBonus": 3, "urgencyDeepThreshold": 0.8, "urgencyShortPenalty": 2, "urgencyDeepBonus": 3, "drawDistance": 8, "aggressiveThreshold": 0.6, "outsideRunShare": { "open": 0.495, "redZone": 0.462 }, "outsideAggressiveLogit": 0.4, "outsideRunLogitOffset": -0.28, "call": { "toGo": [1, 2, 3, 6, 10, 99], "times": ["early", "halfEnd", "q4", "q4Late"], "leads": [-9, -1, 0, 8, 99], "zones": [10, 79, 99], "referenceTime": 0, "referenceLead": 2, "referenceZone": 1, "base": [[-1.419, -0.781, -0.728, -0.553, -0.144, 0.746], [-1.146, -0.755, -0.48, 0.026, 0.655, 1.402], [-1.251, 0.587, 1.532, 2.602, 3.068, 2.224], [-1.258, 1.209, 2.721, 2.709, 2.143, 1.99]], "state": [[0.27, 0.066, 0, 6e-3, -0.132], [1.781, 1.408, 1.278, 1.246, 1.12], [1.136, 0.309, 0.107, -0.181, -0.833], [1.912, 1.458, 0.393, -1.592, -2.717]], "zone": [-0.573, 0, -0.187] } }, "credit": { "roles": ["EDGE", "DT", "LB", "CB", "S"], "tackleRoleShares": { "inside": [0.196, 0.268, 0.278, 0.069, 0.188], "outside": [0.166, 0.179, 0.279, 0.144, 0.232], "scramble": [0.177, 0.091, 0.334, 0.16, 0.238], "screen": [0.093, 0.06, 0.301, 0.272, 0.274], "short": [0.036, 8e-3, 0.281, 0.393, 0.282], "medium": [0.012, 1e-3, 0.12, 0.45, 0.416], "deep": [6e-3, 0, 0.077, 0.459, 0.458] }, "assistedTackleShare": { "inside": 0.183, "outside": 0.141, "scramble": 0.022, "screen": 0.083, "short": 0.062, "medium": 0.034, "deep": 0.015 }, "sackRoleShares": [0.526, 0.277, 0.119, 0.027, 0.051], "interceptionRoleShares": [0.042, 0.017, 0.16, 0.383, 0.398], "slotShare": { "EDGE": [0.716, 0.558, 0.382, 0.232], "DT": [0.661, 0.527, 0.391, 0.265], "LB": [0.845, 0.62, 0.307, 0.147], "CB": [0.853, 0.664, 0.439, 0.24, 0.116], "S": [0.904, 0.724, 0.44, 0.211] }, "fitnessPerPoint": 0.05, "coverDefenderInterceptionWeight": 3 }, "distributions": { "p": [0, 5e-3, 0.01, 0.015, 0.02, 0.03, 0.04, 0.05, 0.075, 0.1, 0.125, 0.15, 0.175, 0.2, 0.225, 0.25, 0.275, 0.3, 0.325, 0.35, 0.375, 0.4, 0.425, 0.45, 0.475, 0.5, 0.525, 0.55, 0.575, 0.6, 0.625, 0.65, 0.675, 0.7, 0.725, 0.75, 0.775, 0.8, 0.825, 0.85, 0.875, 0.9, 0.925, 0.95, 0.96, 0.97, 0.975, 0.98, 0.985, 0.99, 0.993, 0.996, 0.998, 0.999, 1] }, "football": { "rosterSize": 53, "fieldLength": 100, "firstDownYards": 10, "downs": 4, "regulationSeconds": 3600, "quarterSeconds": 900, "overtimeSeconds": 600, "twoMinuteSeconds": 120, "kickoffTouchbackSpot": 35, "puntTouchbackSpot": 20, "endZoneAndHoldYards": 18, "startingTimeouts": 3, "overtimePossessionsRequired": 2, "firstHalfFinalQuarter": 2, "touchdownPoints": 6, "fieldGoalPoints": 3, "safetyPoints": 2, "extraPointPoints": 1, "twoPointPoints": 2 }, "homeField": { "crowdFactor": 1, "awaySackBonus": 23e-4, "awayIntBonus": 1e-3, "targetMargin": 1.74, "restRatingPerDay": 0.18, "maxRestRating": 1.2 }, "kicking": { "extraPointRate": 0.944, "twoPointRate": 0.4773, "twoPointTryEarly": 0.0416, "twoPointTryFourthQuarter": [0.3788, 0.52, 0.0588, 0, 0.9268, 0.4839, 0.0853, 1, 0.3026, 0.2179, 0, 0.0225, 0.9901, 0.0113, 0, 0.9802, 0.1255, 92e-4, 1, 0.0171, 93e-4, 0.7209, 0.9506, 0.0162, 0.1509, 0.0139, 0.0409, 0.0556, 0.0435, 0.8393, 0, 0.0656, 0.1538, 0.0155, 0.0415], "twoPointNeedScores": [2, 5, 8, 11], "distanceBuckets": [30, 40, 50, 55, 60], "distanceRates": [0.9877, 0.9339, 0.7925, 0.7108, 0.6096, 0.3831], "ratingEffectDivisor": 500, "windPenaltyPerMph": 18e-4, "indoorWind": 0, "minAttemptRate": 0.05, "maxAttemptRate": 0.995, "baseMaxDistance": 59, "powerDistanceDivisor": 4, "powerBaseline": 75, "puntMin": 15, "puntMax": 75, "goAggressionLogit": 0.4, "goRateBound": 1e-3, "lastPlayKickClock": 8, "overtimeLateKickClock": 300, "lateKickRemainingClock": 5, "twoPointLeads": 17, "fourthDown": { "toGo": [1, 2, 5, 9, 99], "yardsToGoal": [19, 30, 40, 50, 70, 99], "lateDeficits": [3, 8, 99], "lateYardsToGoal": [40, 99], "goRate": [[0.8971, 0.7982, 0.9203, 0.9267, 0.562, 0.1654], [0.5375, 0.4902, 0.5867, 0.6977, 0.1787, 0.0784], [0.1866, 0.2343, 0.4179, 0.4113, 0.0795, 0.0246], [0.0483, 0.0286, 0.1343, 0.0976, 0.0327, 0.0208], [0.033, 0.0129, 0.0707, 0.0608, 0.0298, 46e-4]], "fieldGoalShare": [[1, 1, 1, 0.0909, 0, 0], [1, 1, 1, 0, 0, 0], [1, 1, 0.9231, 0.0274, 0, 0], [1, 1, 0.8776, 0.0232, 0, 0], [1, 1, 0.808, 0.05, 0, 0]], "lateGoRate": [[0.0843, 0.6703], [0.9151, 0.7358], [0.7468, 0.8009]], "lateFieldGoalShare": [[1, 0.2333], [1, 0], [1, 0.0222]], "lateLevelGoRate": [0.2905, 0.0569], "lateLevelFieldGoalShare": [0.9476, 79e-4] }, "kickoff": { "touchbackRate": 0.2104, "returnRate": 0.7757, "returnTouchdownRate": 28e-4, "returnStart": [1.5, 9.12, 10.81, 12.43, 13.4, 14.74, 15.82, 16.89, 19.03, 20.33, 21.82, 22.66, 23.38, 24.1, 24.72, 25.22, 25.67, 26.06, 26.45, 26.89, 27.33, 27.7, 28.03, 28.36, 28.73, 29.14, 29.54, 29.87, 30.2, 30.53, 30.88, 31.22, 31.58, 32.01, 32.45, 32.97, 33.51, 34.14, 34.84, 35.7, 36.84, 38.97, 40.13, 42.7, 44.83, 46.93, 48.42, 51.86, 54.3, 56.54, 61.85, 73.13, 84.31, 86.41, 99], "catchSpot": 4.4, "otherSpot": 36, "onsideDeficits": [8, 99], "onsideLateShare": [0.3103, 0.7419], "onsideOtherShare": 41e-4, "onsideRecovery": 0.0769, "onsideReceivingSpot": 56, "onsideKickingSpot": 51 }, "punt": { "yardsToGoal": [40, 50, 60, 70, 80, 90, 99], "grossMean": [32.24, 37.56, 44.71, 48.74, 49.12, 49.31, 49.77], "grossSd": [5.61, 6.11, 7.44, 8.47, 8.57, 8.66, 8.29], "snapMean": [38.43, 45.96, 55.86, 65.87, 75.08, 84.84, 94.07], "landingMean": [8.06, 9.96, 12.83, 17.87, 26.16, 35.59, 44.3], "landingSd": [4.76, 4.99, 6.23, 8.19, 8.7, 8.96, 8.54], "touchbackRate": [0.2303, 0.1639, 0.133, 0.0453, 83e-4, 18e-4, 0], "fairCatchRate": [0.2645, 0.4498, 0.3585, 0.2408, 0.2, 0.1838, 0.1365], "returnTouchdownRate": 56e-4, "returnYards": [-10, -3.89, -2.56, -1.83, -1.26, -0.5, -0.47, -0.45, -0.4, -0.34, -0.29, -0.23, -0.18, -0.12, -0.07, -0.01, 0.04, 0.1, 0.15, 0.2, 0.26, 0.31, 0.37, 0.42, 0.48, 1.16, 2.17, 3.15, 4.09, 4.96, 5.75, 6.47, 7.19, 7.89, 8.56, 9.27, 10.03, 10.83, 11.66, 12.58, 13.68, 14.97, 16.57, 19.11, 20.47, 22.69, 24.15, 26.23, 29.16, 34.68, 40.44, 47.16, 55.82, 62.82, 82.5] } }, "passing": { "sackRatePerDropback": 0.0567, "situationToGo": [2, 6, 99], "sackSituation": [0.398, 0.597, 0.793, 0.712, 0.769, 0.874, 0.907, 1.368, 1.631], "completionSituation": [1, 1, 1.026, 1.029, 1.015, 1.015, 0.971, 0.92, 0.949], "routeSituationFactor": [[1, 1, 1, 1], [1, 1, 1, 1], [1.126, 0.945, 0.972, 1.03], [1.032, 1.04, 0.889, 0.995], [1.091, 1.047, 0.899, 0.862], [1.091, 1.039, 0.924, 0.849], [0.777, 1.268, 0.768, 0.83], [0.517, 1.235, 0.99, 0.99], [0.834, 0.839, 1.318, 1.285]], "intPerAttempt": 0.0209, "scrambleSpeedReference": 62, "scrambleSpeedScale": 12, "scrambleYards": [-5.5, 0.56, 0.63, 0.7, 0.77, 0.9, 1.04, 1.18, 1.53, 1.82, 2.1, 2.39, 2.67, 2.94, 3.21, 3.49, 3.76, 4.03, 4.3, 4.57, 4.82, 5.08, 5.34, 5.61, 5.92, 6.22, 6.53, 6.89, 7.24, 7.6, 7.98, 8.37, 8.77, 9.18, 9.63, 10.23, 10.78, 11.31, 11.99, 12.82, 13.85, 15.19, 16.95, 19.66, 21.09, 22.99, 23.96, 25.13, 27.45, 29.74, 32.86, 38.93, 43.93, 48.14, 87.5], "ratingEffectDivisor": 420, "passEdgeCentre": 2.05, "intEdgePerPoint": 0.018, "yardsTiltPerPoint": 9e-3, "yardsTiltOffset": 3, "coverageWeight": 2.1, "forcedCompletionPenalty": 0.12, "forcedIntBonus": 0.025, "windCompletionPenaltyPerMph": 13e-4, "indoorCompletionBonus": 8e-3, "coldCompletionPenalty": 0.02, "extremeColdCompletionPenalty": 0.055, "rainCompletionPenalty": 0.018, "snowCompletionPenalty": 0.028, "homeRatingBoost": 13, "routeZoneCompletion": [[0.953, 0.697, 0.617, 1], [1.008, 1.013, 0.645, 0.958], [1.001, 1.02, 0.993, 0.902], [1.003, 1.041, 1.068, 1.034]], "sackYards": [-30, -17.81, -16.08, -15.08, -14.37, -13.44, -12.84, -12.33, -11.4, -10.8, -10.33, -9.99, -9.64, -9.36, -9.12, -8.88, -8.64, -8.42, -8.24, -8.05, -7.86, -7.68, -7.49, -7.29, -7.1, -6.9, -6.7, -6.51, -6.26, -6, -5.75, -5.5, -5.21, -4.92, -4.63, -4.28, -3.89, -3.49, -3, -2.51, -1.95, -1.37, -0.79, -0.3, -0.14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "routeWeights": { "screen": 0.212, "short": 0.504, "medium": 0.227, "deep": 0.06 }, "routeZones": [10, 20, 40, 99], "routeZoneFactor": [[0.818, 1.698, 0.215, 0], [1.035, 0.906, 1.625, 0.17], [1.026, 0.941, 0.922, 1.329], [1.006, 0.965, 1.021, 1.09]], "routeCompletion": { "screen": 0.78, "short": 0.72, "medium": 0.555, "deep": 0.36 }, "completionYards": { "screen": [-20, -6.58, -5.51, -4.93, -4.38, -3.48, -2.88, -2.35, -1.38, -0.7, -0.2, 0.22, 0.63, 1.01, 1.39, 1.75, 2.11, 2.46, 2.82, 3.17, 3.52, 3.85, 4.17, 4.5, 4.82, 5.14, 5.46, 5.79, 6.12, 6.45, 6.82, 7.19, 7.58, 8.05, 8.51, 9, 9.48, 10.32, 11.07, 11.87, 12.94, 14.39, 16.31, 19.25, 21.07, 23.7, 25.27, 28.09, 31.63, 36.34, 42.13, 52, 63.5, 69.5, 84.5], "short": [-9.5, 0.81, 1.26, 1.59, 1.78, 2.17, 2.53, 2.76, 3.32, 3.73, 4.06, 4.39, 4.66, 4.9, 5.14, 5.38, 5.62, 5.84, 6.06, 6.28, 6.5, 6.73, 6.96, 7.19, 7.42, 7.66, 7.91, 8.16, 8.41, 8.64, 8.87, 9.1, 9.33, 9.62, 10.07, 10.52, 10.96, 11.4, 11.99, 12.66, 13.48, 14.59, 16.19, 18.55, 20.13, 22.08, 23.49, 25.41, 28.23, 32.37, 37.07, 46.86, 57.38, 67.32, 95.5], "medium": [-5.5, 9.3, 9.59, 9.7, 9.81, 10.03, 10.25, 10.47, 10.84, 11.2, 11.55, 11.88, 12.2, 12.52, 12.84, 13.15, 13.46, 13.76, 14.05, 14.35, 14.64, 14.94, 15.24, 15.53, 15.83, 16.13, 16.43, 16.76, 17.1, 17.43, 17.79, 18.15, 18.51, 18.92, 19.33, 19.82, 20.37, 21.1, 21.9, 22.8, 24, 25.46, 27.78, 31.54, 34.07, 37.24, 39.79, 43.56, 47.9, 53.52, 57.52, 64.23, 71.37, 75.38, 89.5], "deep": [11.5, 19.53, 19.64, 19.76, 19.88, 20.11, 20.35, 20.59, 21.22, 21.82, 22.4, 22.93, 23.43, 23.97, 24.51, 25.09, 25.67, 26.24, 26.83, 27.44, 28.08, 28.75, 29.48, 30.2, 30.95, 31.72, 32.54, 33.62, 34.74, 35.85, 36.96, 38.07, 39.24, 40.88, 42.35, 43.93, 45.47, 47.38, 49.52, 51.44, 53.35, 56.19, 59.99, 65.83, 68.32, 71.45, 73.94, 75.03, 76.24, 79.77, 83.28, 87.84, 92.06, 96.78, 98.5] }, "outOfBoundsChance": 0.13, "receiverSkillTerms": 3, "coverageTerms": 3, "rushBlockShedding": 0.25, "throwPowerWeight": [0, 0, 0.25, 0.5], "throwPowerReference": 79.9, "catchInTrafficWeight": 0.25, "catchInTrafficReference": { "WR": 81.2, "TE": 77.9, "RB": 46.8 }, "tableYardLineMax": 50 }, "penalties": { "offensePerSnap": 0.0472, "awarenessPerPoint": 0.02, "awarenessReference": 78, "defensePerSnap": 0.034, "homeCrowdDefenseBonus": 42e-4, "offensivePreSnapShare": 0.494, "falseStartYards": 5, "holdingYards": 10, "automaticFirstDownShare": 0.69, "passInterferenceMean": 9.9, "passInterferenceSd": 7.93, "passInterferenceMin": 5, "passInterferenceMax": 40, "defensiveHoldingYards": 5 }, "pressure": { "pressureRate": 0.3, "pressureSituation": [1.078, 0.962, 0.895, 0.943, 0.928, 0.925, 1.025, 1.133, 1.3], "lineCentre": 35e-4, "lineWeight": 0.36, "pressuredShares": [0.0974, 0.1154, 0.2193, 0.5666], "cleanShares": [0.042, 0.012, 0.0719, 0.8741], "completionFactor": [1.1005, 1.0836, 0.8481, 0.8173], "interceptionFactor": [0.886, 0.93, 1.595, 1.506], "scrambleSpeedMean": 1.81, "pocketReference": 81.1, "readsReference": 81.9, "throwOnRunReference": 81, "aggressionReference": 79.1, "ratingPerPoint": 0.025, "sackRatingPerPoint": 0.01, "scrambleFactorMaximum": 3, "moveAccuracyPerPoint": 5e-3 }, "roster": { "minimums": [{ "label": "C", "positions": ["C"], "count": 1 }, { "label": "QB", "positions": ["QB"], "count": 2 }, { "label": "RB/FB", "positions": ["RB", "FB"], "count": 3 }, { "label": "WR", "positions": ["WR"], "count": 4 }, { "label": "TE", "positions": ["TE"], "count": 2 }, { "label": "OL", "positions": ["LT", "LG", "C", "RG", "RT"], "count": 8 }, { "label": "DL", "positions": ["EDGE", "DT"], "count": 4 }, { "label": "LB", "positions": ["LB"], "count": 3 }, { "label": "DB", "positions": ["CB", "S"], "count": 4 }, { "label": "K", "positions": ["K"], "count": 1 }, { "label": "P", "positions": ["P"], "count": 1 }, { "label": "LS", "positions": ["LS"], "count": 1 }], "depth": { "starter": 0, "second": 1, "third": 2, "fourth": 3 }, "composition": { "QB": 3, "RB": 4, "WR": 6, "TE": 3, "LT": 2, "LG": 2, "C": 1, "RG": 2, "RT": 2, "EDGE": 4, "DT": 5, "LB": 6, "CB": 6, "S": 4, "K": 1, "P": 1, "LS": 1 }, "starterCounts": { "QB": 1, "RB": 1, "FB": 0, "WR": 3, "TE": 1, "LT": 1, "LG": 1, "C": 1, "RG": 1, "RT": 1, "EDGE": 2, "DT": 2, "LB": 3, "CB": 3, "S": 2, "K": 1, "P": 1, "LS": 1 }, "starterMean": 80, "starterSd": 5.2, "backupMean": 67, "backupSd": 3.1, "starterMin": 70, "starterMax": 92, "starMin": 93, "starMax": 99, "starChance": 0.025, "backupMin": 62, "backupMax": 72, "replacementOverall": 55, "replacementRating": 50, "replacementAthleticRating": 60, "teamTalentSd": 1.6, "ratingNoiseSd": 4, "minimumRating": 25, "maximumRating": 99, "baseSkillRating": 42, "athleticOffset": 8, "skillOffset": 0, "secondarySkillOffset": -5, "weakSkillOffset": -18, "consistencyOffset": -6, "potentialMeanBonus": 4, "potentialSd": 4, "ageMin": 21, "ageMax": 34, "ageMode": 25, "accruedAgeOffset": 21, "jerseyMin": 1, "jerseyMax": 99, "defaultHeight": 74, "defaultWeight": 225, "emptyTeamId": -1, "replacementPlayerId": -1, "jerseyRanges": { "QB": [1, 19], "RB": [1, 49], "FB": [1, 49], "WR": [1, 49], "TE": [1, 49], "LT": [50, 79], "LG": [50, 79], "C": [50, 79], "RG": [50, 79], "RT": [50, 79], "EDGE": [50, 99], "DT": [50, 99], "LB": [40, 59], "CB": [20, 49], "S": [20, 49], "K": [1, 19], "P": [1, 19], "LS": [40, 59] } }, "rushing": { "runYards": [-15, -5.29, -4.27, -3.66, -3.24, -2.53, -2.11, -1.7, -0.98, -0.42, -0.11, 0.2, 0.51, 0.76, 1, 1.24, 1.49, 1.69, 1.89, 2.09, 2.29, 2.5, 2.7, 2.9, 3.11, 3.31, 3.52, 3.75, 3.99, 4.22, 4.45, 4.75, 5.05, 5.36, 5.73, 6.15, 6.59, 7.16, 7.8, 8.55, 9.33, 10.74, 12.36, 15.02, 16.62, 19.03, 20.71, 23.15, 26.7, 32.74, 38.63, 48.23, 59.55, 69.41, 99], "shortYardageRunYards": [-15, -5, -3.81, -3.22, -2.81, -2.19, -1.69, -1.35, -0.75, -0.41, -0.26, -0.11, 0.04, 0.19, 0.34, 0.49, 0.71, 0.92, 1.13, 1.35, 1.53, 1.65, 1.77, 1.89, 2.01, 2.13, 2.25, 2.37, 2.49, 2.67, 2.87, 3.06, 3.26, 3.45, 3.76, 4.11, 4.46, 4.99, 5.57, 6.33, 7.39, 9, 10.98, 14.11, 16.29, 19.9, 22.1, 24.84, 29.44, 35.7, 40.35, 50.7, 58.7, 66.05, 90.5], "ratingEffectDivisor": 33, "runDefenseWeight": 2.4, "frontBlend": { "blockShedding": 0.25, "playRecognition": 0.5 }, "tacklingWeight": 0.5, "tacklingReference": 82.3, "powerLineWeight": 0.5, "powerLineCentre": 11.5, "lateStaminaWeight": 0.5, "passThreatWeight": 0.77, "breakawayTail": 0.029, "redZoneYardsPenalty": 0.55, "runShift": 0.14, "fumbleLostPerPlay": 83e-4, "fumbleEligibleMultiplier": 1.45, "fumbleRecoveryOffense": 0.5392, "carryingEffectDivisor": 4200, "hitPowerEffectDivisor": 5200, "outOfBoundsChance": 0.08, "tableYardLineMax": 70, "shortYardageToGo": 2 }, "scoring": { "gameScriptTempoSd": 0, "interceptionReturnTouchdown": 0.0921, "fumbleReturnTouchdown": 0.089, "safetyYardLines": [2, 5, 10], "safetyRate": [0.0366, 0.0171, 53e-4], "redZoneLine": 80 }, "season": { "regularGames": 272, "teams": 32, "gamesPerTeam": 17, "weeks": 18, "playoffTeamsPerConference": 7, "firstSeed": 1, "initialYear": 2026, "maximumGameSnaps": 350 }, "usage": { "targetGroups": ["WR", "TE", "RB"], "targetGroupShare": { "screen": [0.343, 0.158, 0.498], "short": [0.557, 0.26, 0.183], "medium": [0.758, 0.216, 0.026], "deep": [0.834, 0.139, 0.028] }, "targetRankShare": { "WR": [0.382, 0.256, 0.171, 0.097, 0.053], "TE": [0.63, 0.239, 0.097], "RB": [0.543, 0.264, 0.116] }, "targetSlotWeight": { "WR": [0.268, 0.23, 0.202, 0.162, 0.096], "TE": [0.471, 0.337, 0.158], "RB": [0.446, 0.322, 0.154] }, "targetFitnessPerPoint": 0.07, "fitnessMin": 0.5, "fitnessMax": 1.6, "targetFitnessReference": { "WR": [71, 79.4, 79.2, 81.7], "TE": [54.1, 77.3, 77.1, 66.6], "RB": [66.2, 49.9, 50.3, 59.4] }, "receiverSkillReference": { "WR": 82, "TE": 78.6, "RB": 54.6 }, "coverageReference": { "WR": 81.5, "TE": 61.4, "RB": 69.3 }, "backCarryShare": [0.58, 0.26, 0.1, 0.039], "backCarrySlotWeight": [0.474, 0.292, 0.107, 0.056], "quarterbackRunShare": { "shortYardage": 0.218, "goalLine": 0.117, "inside": 0.035, "outside": 0.045 }, "goalLineYards": 3, "receiverOutsideRunShare": 0.124, "hybridCarryThreshold": 60, "carryFitnessPerPoint": 0.07, "carryFitnessReference": { "RB": [67.2, 74.4, 76.9, 59.2], "QB": [44.7, 51.4, 45.3, 43.5], "WR": [65.5, 82.4, 78.2, 64] }, "rusherScoreReference": { "RB": [68.7, 76.2, 77.9, 61.9], "QB": [47, 56.4, 49, 44.6], "WR": [65.5, 83, 78.2, 64] }, "carrierYardsOffset": { "RB": 0, "QB": -0.07, "WR": 1.58 }, "formSd": { "carries": 1, "targets": 0.2 }, "consistencyPerPoint": 0.03 }, "weather": { "indoorTemp": 70, "indoorWind": 0, "coldMean": 34, "coolMean": 44, "mildMean": 58, "warmMean": 72, "hotMean": 84, "tempSd": 12, "windMean": 7, "windSd": 5, "windMin": 0, "windMax": 24, "rainChance": 0.12, "snowChanceCold": 0.13, "snowTemperature": 32, "extremeCold": 20, "coldPenalty": 0.025, "extremeColdPenalty": 0.07, "turfScoringBoost": 0.012 } };

  // stubs/generate.ts
  var RATING_KEYS = [
    "speed",
    "agility",
    "strength",
    "stamina",
    "throwPower",
    "throwAccuracy",
    "throwOnRun",
    "carrying",
    "breakTackle",
    "vision",
    "catching",
    "routeRunning",
    "catchInTraffic",
    "runBlock",
    "passBlock",
    "passRush",
    "runDefense",
    "blockShedding",
    "manCoverage",
    "zoneCoverage",
    "tackling",
    "hitPower",
    "kickPower",
    "kickAccuracy",
    "awareness",
    "playRecognition",
    "poise",
    "consistency",
    "aggression",
    "injuryProne",
    "processing",
    "separation",
    "durability"
  ];
  function createReplacementPlayer(position) {
    const ratings = Object.fromEntries(RATING_KEYS.map((key) => [key, TUNING.roster.replacementRating]));
    ratings.speed = TUNING.roster.replacementAthleticRating;
    ratings.stamina = TUNING.roster.replacementAthleticRating;
    return {
      id: TUNING.roster.replacementPlayerId,
      teamId: TUNING.roster.emptyTeamId,
      firstName: "Replacement",
      lastName: "Player",
      position,
      jersey: TUNING.roster.jerseyMax,
      age: TUNING.roster.ageMode,
      accruedSeasons: 0,
      heightIn: TUNING.roster.defaultHeight,
      weightLb: TUNING.roster.defaultWeight,
      ratings,
      overall: TUNING.roster.replacementOverall,
      potential: TUNING.roster.replacementOverall,
      developmentTrait: 50,
      scoutedOverall: TUNING.roster.replacementOverall,
      scoutingPct: TUNING.coach.riskScale,
      contract: null,
      draft: null,
      weeksInjured: 0,
      retiredYear: null,
      careerStats: []
    };
  }

  // cornerstone/depthChart.ts
  var GROUP_POSITIONS = {
    QB: ["QB"],
    RB: ["RB", "FB"],
    WR: ["WR"],
    TE: ["TE"],
    OL: ["LT", "LG", "C", "RG", "RT"],
    DL: ["EDGE", "DT"],
    LB: ["LB"],
    DB: ["CB", "S"],
    ST: ["K", "P", "LS"]
  };
  function availableSorted(players) {
    return players.filter((player) => player.weeksInjured === 0).sort((left, right) => right.overall - left.overall || left.id - right.id);
  }
  function buildDepthChart(team, players, formRng) {
    const rosterIds = new Set(team.roster);
    const roster = players.filter((player) => rosterIds.has(player.id));
    const form = /* @__PURE__ */ new Map();
    if (formRng !== void 0) for (const player of roster) form.set(player.id, formRng.gauss(0, 1));
    const positions = /* @__PURE__ */ new Map();
    const groups = /* @__PURE__ */ new Map();
    for (const player of roster) {
      if (!positions.has(player.position)) positions.set(player.position, availableSorted(roster.filter((candidate) => candidate.position === player.position)));
    }
    for (const [group, groupPositions] of Object.entries(GROUP_POSITIONS)) {
      groups.set(group, availableSorted(roster.filter((player) => groupPositions.includes(player.position))));
    }
    const available = availableSorted(roster);
    const fallback = (position, depth) => {
      const group = Object.keys(GROUP_POSITIONS).find((key) => GROUP_POSITIONS[key].includes(position));
      const related = group === void 0 ? [] : groups.get(group) ?? [];
      return related[depth] ?? positions.get(position)?.[0] ?? related[0] ?? available[0] ?? createReplacementPlayer(position);
    };
    return {
      byPosition: positions,
      byGroup: groups,
      form,
      get(position, depth = 0) {
        return positions.get(position)?.[depth] ?? fallback(position, depth);
      },
      getGroup(group, depth = 0) {
        const fallbackPosition = GROUP_POSITIONS[group][0];
        return groups.get(group)?.[depth] ?? fallback(fallbackPosition, depth);
      }
    };
  }
  function receivingOptions(chart) {
    const ranks = TUNING.usage.targetRankShare;
    const options = [];
    const add = (group, players) => {
      players.slice(0, ranks[group].length).forEach((player, rank) => options.push({ player, group, rank }));
    };
    add("WR", chart.byPosition.get("WR") ?? []);
    add("TE", chart.byPosition.get("TE") ?? []);
    add("RB", chart.byGroup.get("RB") ?? []);
    return options;
  }

  // cornerstone/distributions.ts
  function quantileAt(values, u) {
    const grid = TUNING.distributions.p;
    for (let index = 1; index < grid.length; index += 1) {
      const high = grid[index];
      if (u <= high) {
        const low = grid[index - 1];
        const t = high === low ? 0 : (u - low) / (high - low);
        const from = values[index - 1];
        return from + t * (values[index] - from);
      }
    }
    return values[values.length - 1];
  }
  function cellOf(limits, value) {
    const index = limits.findIndex((limit) => value <= limit);
    return index < 0 ? limits.length - 1 : index;
  }

  // cornerstone/coachAI.ts
  function scoreDiff(context, isHome) {
    return isHome ? context.homeScore - context.awayScore : context.awayScore - context.homeScore;
  }
  function urgency(context, isHome) {
    const difference = scoreDiff(context, isHome);
    if (context.quarter > TUNING.football.downs) {
      if (difference < 0) return TUNING.coach.urgencyFourthQuarter;
      if (difference === 0) return TUNING.coach.urgencyOvertimeTied;
      return TUNING.coach.urgencyBase;
    }
    if (difference >= 0) return TUNING.coach.urgencyBase;
    const timeFactor = context.quarter === TUNING.football.downs ? TUNING.coach.urgencyFourthQuarter : context.quarter === TUNING.coach.lateQuarter ? TUNING.coach.urgencyThirdQuarter : 0;
    if (difference >= -TUNING.coach.urgencyCloseDeficit && timeFactor === TUNING.coach.urgencyFourthQuarter) return TUNING.coach.urgencyFourthQuarter;
    return TUNING.coach.urgencyMid * timeFactor;
  }
  function selectPassType(coach, context, need, rng) {
    const zoneFactor = TUNING.passing.routeZoneFactor[cellOf(TUNING.passing.routeZones, TUNING.football.fieldLength - context.yardLine)];
    let screen = TUNING.passing.routeWeights.screen * TUNING.coach.weightScale;
    let short = TUNING.passing.routeWeights.short * TUNING.coach.weightScale;
    let medium = TUNING.passing.routeWeights.medium * TUNING.coach.weightScale;
    let deep = TUNING.passing.routeWeights.deep * TUNING.coach.weightScale;
    deep += coach.aggressiveness * TUNING.coach.aggressionDeepScale;
    if (coach.riskTolerance < TUNING.coach.conservativeThreshold) {
      screen += TUNING.coach.conservativeSafeBonus;
      short += TUNING.coach.conservativeSafeBonus;
      deep -= TUNING.coach.conservativeDeepPenalty;
    }
    if (coach.trustInQB < TUNING.coach.lowTrustThreshold) {
      deep = 0;
      medium -= TUNING.coach.lowTrustMediumPenalty;
      screen += TUNING.coach.lowTrustScreenBonus;
    }
    if (need > TUNING.coach.urgencyDeepThreshold) {
      short -= TUNING.coach.urgencyShortPenalty;
      deep += TUNING.coach.urgencyDeepBonus;
    }
    const cell = (Math.min(context.down, TUNING.football.downs - 1) - 1) * TUNING.passing.situationToGo.length + cellOf(TUNING.passing.situationToGo, context.toGo);
    const situation2 = TUNING.passing.routeSituationFactor[cell];
    const choices = [
      ["screen", screen * zoneFactor[0] * situation2[0]],
      ["shortPass", short * zoneFactor[1] * situation2[1]],
      ["mediumPass", medium * zoneFactor[2] * situation2[2]],
      ["deepPass", deep * zoneFactor[3] * situation2[3]]
    ];
    const total = choices.reduce((sum, choice) => sum + Math.max(0, choice[1]), 0);
    let roll = rng.next() * total;
    for (const choice of choices) {
      roll -= Math.max(0, choice[1]);
      if (roll <= 0) return choice[0];
    }
    return "shortPass";
  }
  function selectRunType(coach, context, rng) {
    const rules = TUNING.coach;
    if (context.down > 1 && context.toGo > rules.drawDistance) return "draw";
    const share = context.yardLine >= TUNING.scoring.redZoneLine ? rules.outsideRunShare.redZone : rules.outsideRunShare.open;
    const logit = Math.log(share / (1 - share)) - rules.outsideRunLogitOffset + (coach.aggressiveness > rules.aggressiveThreshold ? rules.outsideAggressiveLogit : 0);
    return rng.chance(1 / (1 + Math.exp(-logit))) ? "outsideRun" : "insideRun";
  }
  function dropbackLogit(context, isHome) {
    const call = TUNING.coach.call;
    const down = Math.min(TUNING.football.downs, Math.max(1, context.down)) - 1;
    const window = context.quarter === TUNING.football.firstHalfFinalQuarter && context.clock <= TUNING.football.twoMinuteSeconds ? "halfEnd" : context.quarter >= TUNING.football.downs ? context.clock <= TUNING.clock.lateGameSeconds ? "q4Late" : "q4" : "early";
    const time = call.times.indexOf(window);
    return call.base[down]?.[cellOf(call.toGo, context.toGo)] + call.state[time]?.[cellOf(call.leads, scoreDiff(context, isHome))] + call.zone[cellOf(call.zones, context.yardLine)];
  }
  function selectPlay(coach, context, isHome, rng) {
    const need = urgency(context, isHome);
    const share = TUNING.coach.passPlayShare;
    const passLogit = dropbackLogit(context, isHome) + (coach.passBias - share) / (share * (1 - share));
    const passProbability = 1 / (1 + Math.exp(-passLogit));
    const difference = scoreDiff(context, isHome);
    const playType = rng.chance(passProbability) ? selectPassType(coach, context, need, rng) : selectRunType(coach, context, rng);
    const drainClock = context.quarter === TUNING.football.downs && (difference > TUNING.coach.drainLead || difference > 0 && context.clock <= TUNING.clock.lateGameSeconds);
    let riskTolerance = Math.round(coach.riskTolerance * TUNING.coach.riskScale);
    if (context.down === TUNING.coach.lateQuarter && context.toGo > TUNING.coach.desperateDistance) riskTolerance += TUNING.coach.desperateRiskBonus;
    if (context.yardLine >= TUNING.scoring.redZoneLine) riskTolerance -= TUNING.coach.redZoneRiskPenalty;
    let tempo = Math.round(coach.tempo * TUNING.coach.riskScale);
    if (difference < -TUNING.coach.lateDeficit && context.quarter === TUNING.football.downs && context.clock < TUNING.coach.twoScoreHurryClock) tempo = TUNING.coach.turboTempo;
    if (drainClock) tempo = TUNING.coach.drainTempo;
    if (context.quarter > TUNING.football.downs && difference === 0) tempo = TUNING.coach.turboTempo;
    if (context.quarter === TUNING.football.downs && difference === 0 && context.clock < TUNING.football.twoMinuteSeconds) tempo = TUNING.coach.turboTempo;
    if (context.quarter === TUNING.football.firstHalfFinalQuarter && context.clock <= TUNING.football.twoMinuteSeconds) tempo = TUNING.coach.turboTempo;
    if (context.quarter === TUNING.football.downs && difference < 0 && context.clock <= TUNING.football.twoMinuteSeconds) tempo = TUNING.coach.turboTempo;
    if (context.quarter === TUNING.football.downs && context.clock <= TUNING.football.twoMinuteSeconds && difference <= 0 && difference >= -TUNING.football.fieldGoalPoints && context.yardLine >= TUNING.coach.kickRangeYardLine) {
      tempo = Math.round(coach.tempo * TUNING.coach.riskScale);
    }
    if (drainClock) tempo = TUNING.coach.drainTempo;
    const noHuddleOdds = TUNING.coach.noHuddleRate / (1 - TUNING.coach.noHuddleRate) * Math.exp(TUNING.coach.noHuddleTempoLogit * (coach.tempo - TUNING.coach.neutral) / TUNING.coach.profileSd);
    const noHuddle = rng.chance(tempo === TUNING.coach.turboTempo ? TUNING.coach.hurryNoHuddleShare : noHuddleOdds / (1 + noHuddleOdds));
    return {
      playType,
      riskTolerance,
      tempo,
      forceBall: need > TUNING.coach.urgencyHigh && context.clock <= TUNING.coach.forceBallClock && difference < -TUNING.coach.forceBallDeficit,
      drainClock,
      noHuddle,
      maxReads: coach.trustInQB > TUNING.coach.trustReads ? TUNING.coach.maxReadsTrusted : TUNING.coach.maxReadsSimple
    };
  }

  // cornerstone/playEngine.ts
  var ROUTE_INDEX = { screen: 0, short: 1, medium: 2, deep: 3 };
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function clockUsed(rng) {
    return rng.int(TUNING.clock.snapToWhistleMin, TUNING.clock.snapToWhistleMax);
  }
  function resultBase(rng) {
    return { clockUsed: clockUsed(rng), isTurnover: false, isTouchdown: false, isFirstDown: false, outOfBounds: false, players: {} };
  }
  function average(players, field) {
    return players.reduce((sum, player) => sum + player.ratings[field], 0) / players.length;
  }
  function meanOf(...values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
  function offensiveLine(offense) {
    return [offense.get("LT"), offense.get("LG"), offense.get("C"), offense.get("RG"), offense.get("RT")];
  }
  function penaltyResult(offense, context, rng, isHomeOffense) {
    const rules = TUNING.penalties;
    const defenseRate = rules.defensePerSnap + (isHomeOffense ? rules.homeCrowdDefenseBonus * context.crowdFactor : 0);
    const offenseRate = rules.offensePerSnap * Math.exp(-rules.awarenessPerPoint * (average(offensiveLine(offense), "awareness") - rules.awarenessReference));
    const roll = rng.next();
    if (roll >= offenseRate + defenseRate) return null;
    const onOffense = roll < offenseRate;
    let yards;
    let automaticFirstDown = false;
    if (onOffense) {
      yards = rng.chance(rules.offensivePreSnapShare) ? rules.falseStartYards : rules.holdingYards;
    } else if (rng.chance(rules.automaticFirstDownShare)) {
      automaticFirstDown = true;
      yards = Math.round(clamp(rng.gauss(rules.passInterferenceMean, rules.passInterferenceSd), rules.passInterferenceMin, rules.passInterferenceMax));
    } else {
      yards = rules.defensiveHoldingYards;
    }
    const applied = onOffense ? -yards : yards;
    return {
      ...resultBase(rng),
      yards: applied,
      type: "penalty",
      isFirstDown: automaticFirstDown || !onOffense && applied >= context.toGo,
      penalty: { yards, onOffense, automaticFirstDown },
      desc: `${onOffense ? "Offensive" : "Defensive"} penalty, ${yards} yards`
    };
  }
  function creditFitness(player, kind) {
    const ratings = player.ratings;
    if (kind === "tackle") return meanOf(ratings.tackling, ratings.playRecognition);
    if (kind === "sack") return meanOf(ratings.passRush, ratings.blockShedding);
    return meanOf(meanOf(ratings.manCoverage, ratings.zoneCoverage), ratings.playRecognition);
  }
  var creditPools = /* @__PURE__ */ new WeakMap();
  function rolePools(defense, kind) {
    let byKind = creditPools.get(defense);
    if (byKind === void 0) {
      byKind = /* @__PURE__ */ new Map();
      creditPools.set(defense, byKind);
    }
    const cached = byKind.get(kind);
    if (cached !== void 0) return cached;
    const credit = TUNING.credit;
    const pools = credit.roles.map((role) => {
      const slots = credit.slotShare[role];
      const players = (defense.byPosition.get(role) ?? []).slice(0, slots.length);
      const weights = players.map((player, slot) => slots[slot] * Math.exp(credit.fitnessPerPoint * (creditFitness(player, kind) - TUNING.roster.starterMean)));
      return { players, weights, total: weights.reduce((sum, weight) => sum + weight, 0) };
    });
    byKind.set(kind, pools);
    return pools;
  }
  function creditedDefender(defense, roleShares, kind, u, options = {}) {
    const pools = rolePools(defense, kind);
    const adjust = (player) => player === options.exclude ? 0 : player === options.covering ? TUNING.credit.coverDefenderInterceptionWeight : 1;
    const adjusted = options.exclude === void 0 && options.covering === void 0 ? null : pools.map((pool) => pool.weights.map((weight, index) => weight * adjust(pool.players[index])));
    const roleTotal = (index) => adjusted === null ? pools[index].total : adjusted[index].reduce((sum, weight) => sum + weight, 0);
    const totals = pools.map((_, index) => roleTotal(index));
    const mass = pools.reduce((sum, _, index) => sum + (totals[index] > 0 ? roleShares[index] : 0), 0);
    if (mass <= 0) return options.covering ?? defense.getGroup("DB", TUNING.roster.depth.starter);
    let roll = u * mass;
    let last = null;
    for (let role = 0; role < pools.length; role += 1) {
      const total = totals[role];
      if (total <= 0) continue;
      const pool = pools[role];
      const weights = adjusted === null ? pool.weights : adjusted[role];
      for (let index = 0; index < pool.players.length; index += 1) {
        const weight = roleShares[role] * weights[index] / total;
        if (weight <= 0) continue;
        last = pool.players[index];
        roll -= weight;
        if (roll <= 0) return last;
      }
    }
    return last;
  }
  function tacklers(defense, category, rng) {
    const shares = TUNING.credit.tackleRoleShares[category];
    const tackler = creditedDefender(defense, shares, "tackle", rng.next());
    const assister = rng.chance(TUNING.credit.assistedTackleShare[category]) ? creditedDefender(defense, shares, "tackle", rng.next(), { exclude: tackler }) : null;
    return { tackler, assister: assister === tackler ? null : assister };
  }
  function tackleCredit(credited, touchdown2) {
    if (touchdown2) return {};
    return credited.assister === null ? { tackler: credited.tackler.id } : { tackler: credited.tackler.id, assister: credited.assister.id };
  }
  function usageForm(chart, player, sd) {
    const z = chart.form.get(player.id);
    if (z === void 0) return 1;
    const reference = TUNING.roster.starterMean + TUNING.roster.consistencyOffset;
    const spread = sd * Math.exp(TUNING.usage.consistencyPerPoint * (reference - player.ratings.consistency));
    return Math.exp(spread * z - spread * spread / 2);
  }
  function applyForm(chart, items, sd) {
    const totals = /* @__PURE__ */ new Map();
    for (const item of items) {
      const total = totals.get(item.group) ?? { before: 0, after: 0 };
      total.before += item.weight;
      item.weight *= usageForm(chart, item.player, sd);
      total.after += item.weight;
      totals.set(item.group, total);
    }
    for (const item of items) {
      const total = totals.get(item.group);
      if (total.after > 0) item.weight *= total.before / total.after;
    }
  }
  var CARRY_SCORE = { inside: 0, outside: 1, draw: 2, power: 3 };
  function carryCell(intent, context) {
    if (context.down >= TUNING.football.downs - 1 && context.toGo <= TUNING.rushing.shortYardageToGo) return "shortYardage";
    if (context.yardLine >= TUNING.football.fieldLength - TUNING.usage.goalLineYards) return "goalLine";
    return intent.playType === "outsideRun" ? "outside" : "inside";
  }
  function isPowerCell(cell) {
    return cell === "shortYardage" || cell === "goalLine";
  }
  function runScore(intent, cell) {
    if (isPowerCell(cell)) return "power";
    return intent.playType === "draw" ? "draw" : intent.playType === "outsideRun" ? "outside" : "inside";
  }
  function carryScore(player, score) {
    const ratings = player.ratings;
    switch (score) {
      case "inside":
        return meanOf(ratings.strength, ratings.breakTackle, ratings.carrying, ratings.vision);
      case "outside":
        return meanOf(ratings.speed, ratings.agility, ratings.vision);
      case "draw":
        return meanOf(ratings.vision, ratings.agility);
      case "power":
        return meanOf(ratings.strength, ratings.breakTackle);
    }
  }
  function carryFitness(player, group, score) {
    const usage = TUNING.usage;
    const reference = usage.carryFitnessReference[group][CARRY_SCORE[score]];
    return clamp(Math.exp(usage.carryFitnessPerPoint * (carryScore(player, score) - reference)), usage.fitnessMin, usage.fitnessMax);
  }
  function chooseRusher(chart, intent, context, rng) {
    const usage = TUNING.usage;
    const cell = carryCell(intent, context);
    const power = isPowerCell(cell);
    const backScore = runScore(intent, cell);
    const candidates = [];
    const quarterback = chart.byPosition.get("QB")?.[TUNING.roster.depth.starter];
    if (quarterback !== void 0) {
      candidates.push({ player: quarterback, group: "QB", weight: usage.quarterbackRunShare[cell] * carryFitness(quarterback, "QB", power ? "power" : "outside") });
    }
    const receivers = cell === "outside" ? (chart.byPosition.get("WR") ?? []).slice(0, usage.targetSlotWeight.WR.length).filter((player) => player.ratings.carrying >= usage.hybridCarryThreshold && player.ratings.breakTackle >= usage.hybridCarryThreshold) : [];
    const receiverSlots = receivers.reduce((sum, _, rank) => sum + usage.targetSlotWeight.WR[rank], 0);
    receivers.forEach((player, rank) => candidates.push({
      player,
      group: "WR",
      weight: usage.receiverOutsideRunShare * usage.targetSlotWeight.WR[rank] / receiverSlots * carryFitness(player, "WR", "outside")
    }));
    const backs = (chart.byGroup.get("RB") ?? []).slice(0, usage.backCarrySlotWeight.length);
    const backSlots = backs.reduce((sum, _, rank) => sum + usage.backCarrySlotWeight[rank], 0);
    const backShare = 1 - usage.quarterbackRunShare[cell] - (receivers.length > 0 ? usage.receiverOutsideRunShare : 0);
    backs.forEach((player, rank) => candidates.push({
      player,
      group: "RB",
      weight: backShare * usage.backCarrySlotWeight[rank] / backSlots * carryFitness(player, "RB", backScore)
    }));
    if (HOOKS.game) HOOKS.game.backCarries(candidates, backShare, backScore, (player, score) => carryFitness(player, "RB", score));
    applyForm(chart, candidates, usage.formSd.carries);
    const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
    if (total <= 0) return { player: chart.getGroup("RB", TUNING.roster.depth.starter), group: "RB" };
    let roll = rng.next() * total;
    for (const candidate of candidates) {
      roll -= candidate.weight;
      if (roll <= 0) return { player: candidate.player, group: candidate.group };
    }
    const last = candidates[candidates.length - 1];
    return { player: last.player, group: last.group };
  }
  function isLateGame(context) {
    return context.quarter >= TUNING.football.downs;
  }
  function staminaEdge(context, side, against) {
    return isLateGame(context) ? TUNING.rushing.lateStaminaWeight * (average(side, "stamina") - average(against, "stamina")) : 0;
  }
  function frontRunDefense(player) {
    const blend = TUNING.rushing.frontBlend;
    const ratings = player.ratings;
    return player.position === "LB" ? ratings.runDefense * (1 - blend.playRecognition) + ratings.playRecognition * blend.playRecognition : ratings.runDefense * (1 - blend.blockShedding) + ratings.blockShedding * blend.blockShedding;
  }
  function fumbleResult(base, ballCarrier, tackler, rng) {
    const skillAdjustment = (tackler.ratings.hitPower - ballCarrier.ratings.carrying) / TUNING.rushing.carryingEffectDivisor;
    const fumbleChance = TUNING.rushing.fumbleLostPerPlay / (1 - TUNING.rushing.fumbleRecoveryOffense) * TUNING.rushing.fumbleEligibleMultiplier + skillAdjustment;
    if (!rng.chance(fumbleChance)) return base;
    const lost = !rng.chance(TUNING.rushing.fumbleRecoveryOffense);
    return {
      ...base,
      type: "fumble",
      isTurnover: lost,
      desc: `${ballCarrier.lastName} fumbles${lost ? ", defense recovers" : ", offense recovers"}`
    };
  }
  function resolveRun(offense, defense, intent, context, rng) {
    const carrier = chooseRusher(offense, intent, context, rng);
    const rusher = carrier.player;
    const blockers = offensiveLine(offense);
    const front = [defense.get("EDGE", 0), defense.get("EDGE", 1), defense.get("DT", 0), defense.get("LB", 0)];
    const secondLevel = [defense.get("LB", 0), defense.get("LB", 1), defense.get("S", 0), defense.get("S", 1)];
    const redZonePenalty = context.yardLine >= TUNING.scoring.redZoneLine ? TUNING.rushing.redZoneYardsPenalty : 0;
    const rules = TUNING.rushing;
    const mean = TUNING.roster.starterMean;
    const passThreat = offense.get("QB").ratings.throwAccuracy - mean;
    const cell = carryCell(intent, context);
    const score = runScore(intent, cell);
    const frontDefense = front.reduce((sum, player) => sum + frontRunDefense(player), 0) / front.length;
    const powerLine = isPowerCell(cell) ? rules.powerLineWeight * (average(blockers, "strength") - average(front, "strength") - rules.powerLineCentre) : 0;
    const matchup = (average(blockers, "runBlock") - mean - rules.runDefenseWeight * (frontDefense - mean) + (carryScore(rusher, score) - TUNING.usage.rusherScoreReference[carrier.group][CARRY_SCORE[score]]) - rules.tacklingWeight * (average(secondLevel, "tackling") - rules.tacklingReference) + powerLine + staminaEdge(context, blockers, front) + rules.passThreatWeight * passThreat) / rules.ratingEffectDivisor - redZonePenalty + TUNING.usage.carrierYardsOffset[carrier.group] + (HOOKS.game ? HOOKS.game.runShift(rusher, defense) : 0);
    const tail = TUNING.rushing.breakawayTail;
    let u = rng.next();
    if (rng.chance(Math.max(0, rusher.ratings.speed - TUNING.roster.starterMean) / TUNING.rushing.carryingEffectDivisor)) u = 1 - tail * rng.next();
    const shortYardage = context.down >= TUNING.football.downs - 1 && context.toGo <= TUNING.rushing.shortYardageToGo;
    const table = shortYardage ? TUNING.rushing.shortYardageRunYards : TUNING.rushing.runYards;
    const yards = Math.min(Math.round(quantileAt(table, u) + matchup + TUNING.rushing.runShift), TUNING.football.fieldLength - context.yardLine);
    const credited = tacklers(defense, intent.playType === "outsideRun" ? "outside" : "inside", rng);
    const isTouchdown = context.yardLine + yards >= TUNING.football.fieldLength;
    const base = {
      ...resultBase(rng),
      yards,
      type: "run",
      isTouchdown,
      isFirstDown: yards >= context.toGo,
      outOfBounds: rng.chance(TUNING.rushing.outOfBoundsChance),
      players: { rusher: rusher.id, ...tackleCredit(credited, isTouchdown) },
      desc: `${rusher.lastName} runs for ${yards} yards`
    };
    return fumbleResult(base, rusher, credited.tackler, rng);
  }
  function routeKind(intent) {
    if (intent.playType === "screen") return "screen";
    if (intent.playType === "shortPass" || intent.playType === "playAction") return "short";
    if (intent.playType === "deepPass") return "deep";
    return "medium";
  }
  function routeFitnessScore(player, kind) {
    const ratings = player.ratings;
    switch (kind) {
      case "screen":
        return meanOf(ratings.agility, ratings.breakTackle, ratings.catching);
      case "short":
        return meanOf(ratings.routeRunning, ratings.catching, ratings.separation);
      case "medium":
        return meanOf(ratings.routeRunning, ratings.separation, ratings.catchInTraffic);
      case "deep":
        return meanOf(ratings.speed, ratings.separation, ratings.catching);
    }
  }
  var targetPools = /* @__PURE__ */ new WeakMap();
  function targetPool(offense, kind) {
    let byKind = targetPools.get(offense);
    if (byKind === void 0) {
      byKind = /* @__PURE__ */ new Map();
      targetPools.set(offense, byKind);
    }
    const cached = byKind.get(kind);
    if (cached !== void 0) return cached;
    const usage = TUNING.usage;
    const route = ROUTE_INDEX[kind];
    const options = receivingOptions(offense);
    const fielded = { WR: 0, TE: 0, RB: 0 };
    for (const option of options) fielded[option.group] += usage.targetSlotWeight[option.group][option.rank];
    const weighted = options.map((option) => {
      const groupShare = usage.targetGroupShare[kind][usage.targetGroups.indexOf(option.group)];
      const slotShare = usage.targetSlotWeight[option.group][option.rank] / fielded[option.group];
      const reference = usage.targetFitnessReference[option.group][route];
      const fitness = clamp(Math.exp(usage.targetFitnessPerPoint * (routeFitnessScore(option.player, kind) - reference)), usage.fitnessMin, usage.fitnessMax);
      return { player: option.player, group: option.group, weight: groupShare * slotShare * fitness };
    });
    applyForm(offense, weighted, usage.formSd.targets);
    let running = 0;
    const cumulative = weighted.map((item) => {
      running += item.weight;
      return running;
    });
    const pool = { options, cumulative };
    byKind.set(kind, pool);
    return pool;
  }
  function routeFitness(option, kind) {
    const usage = TUNING.usage;
    const reference = usage.targetFitnessReference[option.group][ROUTE_INDEX[kind]];
    return clamp(Math.exp(usage.targetFitnessPerPoint * (routeFitnessScore(option.player, kind) - reference)), usage.fitnessMin, usage.fitnessMax);
  }
  var gameTargetPools = /* @__PURE__ */ new WeakMap();
  function gameTargetPool(offense, kind) {
    let byKind = gameTargetPools.get(offense);
    if (byKind === void 0) {
      byKind = /* @__PURE__ */ new Map();
      gameTargetPools.set(offense, byKind);
    }
    const cached = byKind.get(kind);
    if (cached !== void 0) return cached;
    const options = receivingOptions(offense);
    const weighted = options.map((option) => ({
      player: option.player,
      group: option.group,
      weight: HOOKS.game.targetWeight(option, kind, (route) => routeFitness(option, route))
    }));
    applyForm(offense, weighted, TUNING.usage.formSd.targets);
    let running = 0;
    const cumulative = weighted.map((item) => {
      running += item.weight;
      return running;
    });
    const pool = { options, cumulative };
    byKind.set(kind, pool);
    return pool;
  }
  function chooseReceiver(offense, kind, rng) {
    const { options, cumulative } = HOOKS.game ? gameTargetPool(offense, kind) : targetPool(offense, kind);
    const roll = rng.next() * cumulative[cumulative.length - 1];
    for (let index = 0; index < options.length; index += 1) {
      if (roll <= cumulative[index]) return options[index];
    }
    return options[options.length - 1];
  }
  function coverDefender(defense, option) {
    const depth = TUNING.roster.depth;
    if (option.group === "WR") return defense.get("CB", Math.min(option.rank, depth.third));
    return defense.get(option.group === "TE" ? "LB" : "S", Math.min(option.rank, depth.second));
  }
  function ratingFactor(rating, reference, perPoint = TUNING.pressure.ratingPerPoint) {
    return Math.exp(perPoint * (rating - reference));
  }
  var DROPBACK_OUTCOMES = ["sack", "scramble", "throwaway", "move", "pocket"];
  function dropbackOutcome(qb, pressured, sackShare, u) {
    const rules = TUNING.pressure;
    const ratings = qb.ratings;
    const speed = Math.min(
      rules.scrambleFactorMaximum,
      Math.exp((ratings.speed - TUNING.passing.scrambleSpeedReference) / TUNING.passing.scrambleSpeedScale)
    ) / rules.scrambleSpeedMean;
    const shares = pressured ? rules.pressuredShares : rules.cleanShares;
    const rest = pressured ? 1 - sackShare : 1;
    const weights = [
      pressured ? sackShare / ratingFactor(meanOf(ratings.processing, ratings.poise, ratings.awareness), rules.pocketReference, rules.sackRatingPerPoint) : 0,
      rest * shares[0] * speed,
      rest * shares[1] * ratingFactor(meanOf(ratings.processing, ratings.awareness), rules.readsReference),
      rest * shares[2] * ratingFactor(ratings.throwOnRun, rules.throwOnRunReference),
      rest * shares[3] * (pressured ? ratingFactor(ratings.aggression, rules.aggressionReference) : 1)
    ];
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let roll = u * total;
    for (let index = 0; index < weights.length; index += 1) {
      roll -= weights[index];
      if (roll <= 0) return DROPBACK_OUTCOMES[index];
    }
    return "pocket";
  }
  function resolvePass(offense, defense, intent, context, isHomeOffense, rng) {
    const qb = offense.get("QB");
    const blockers = offensiveLine(offense);
    const rushers = [defense.get("EDGE", 0), defense.get("EDGE", 1), defense.get("DT", 0), defense.get("DT", 1)];
    const protection = average(blockers, "passBlock");
    const shed = TUNING.passing.rushBlockShedding;
    const passRush = average(rushers, "passRush") * (1 - shed) + average(rushers, "blockShedding") * shed;
    const sackAdjustment = (passRush - protection + staminaEdge(context, rushers, blockers)) / TUNING.passing.ratingEffectDivisor;
    const awaySackBonus = isHomeOffense ? 0 : context.crowdFactor * TUNING.homeField.awaySackBonus;
    const situation2 = (Math.min(context.down, TUNING.football.downs - 1) - 1) * TUNING.passing.situationToGo.length + cellOf(TUNING.passing.situationToGo, context.toGo);
    const baseSackRate = TUNING.passing.sackRatePerDropback * TUNING.passing.sackSituation[situation2];
    const pressureBase = TUNING.pressure.pressureRate * TUNING.pressure.pressureSituation[situation2];
    const sackShare = clamp(baseSackRate / pressureBase, 0, 1);
    const lineTerm = TUNING.pressure.lineWeight * (sackAdjustment - TUNING.pressure.lineCentre) + awaySackBonus;
    const pressured = rng.chance(clamp(pressureBase + lineTerm / sackShare, 0, 1));
    const outcome = dropbackOutcome(qb, pressured, sackShare, rng.next());
    if (outcome === "sack") {
      const yards2 = Math.min(0, Math.round(quantileAt(TUNING.passing.sackYards, rng.next())));
      const sacker = creditedDefender(defense, TUNING.credit.sackRoleShares, "sack", rng.next());
      return {
        ...resultBase(rng),
        yards: yards2,
        type: "sack",
        isFirstDown: false,
        players: { passer: qb.id, sacker: sacker.id },
        pressure: true,
        desc: `${qb.lastName} sacked for ${Math.abs(yards2)} yards`
      };
    }
    if (outcome === "scramble") {
      const yards2 = Math.round(quantileAt(TUNING.passing.scrambleYards, rng.next()));
      const cappedYards = Math.min(yards2, TUNING.football.fieldLength - context.yardLine);
      const credited2 = tacklers(defense, "scramble", rng);
      const isTouchdown2 = context.yardLine + cappedYards >= TUNING.football.fieldLength;
      const base2 = {
        ...resultBase(rng),
        yards: cappedYards,
        type: "scramble",
        isTouchdown: isTouchdown2,
        isFirstDown: cappedYards >= context.toGo,
        outOfBounds: rng.chance(TUNING.rushing.outOfBoundsChance),
        players: { rusher: qb.id, ...tackleCredit(credited2, isTouchdown2) },
        pressure: pressured,
        desc: `${qb.lastName} scrambles for ${cappedYards} yards`
      };
      return fumbleResult(base2, qb, credited2.tackler, rng);
    }
    if (outcome === "throwaway") {
      return {
        ...resultBase(rng),
        yards: 0,
        type: "incomplete",
        outOfBounds: true,
        players: { passer: qb.id },
        pressure: pressured,
        throwaway: true,
        desc: `${qb.lastName} throws it away`
      };
    }
    const onTheMove = outcome === "move";
    const throwCell = (pressured ? 2 : 0) + (onTheMove ? 1 : 0);
    const completionFactor = TUNING.pressure.completionFactor[throwCell] * (onTheMove ? 1 + TUNING.pressure.moveAccuracyPerPoint * (qb.ratings.throwOnRun - TUNING.pressure.throwOnRunReference) : 1);
    const interceptionFactor = TUNING.pressure.interceptionFactor[throwCell] * (pressured && !onTheMove ? ratingFactor(qb.ratings.aggression, TUNING.pressure.aggressionReference) : 1);
    const throwFlags = { pressure: pressured, outOfPocket: onTheMove };
    const kind = routeKind(intent);
    const target = chooseReceiver(offense, kind, rng);
    const receiver = target.player;
    const defender = coverDefender(defense, target);
    const coverage = (defender.ratings.manCoverage + defender.ratings.zoneCoverage + defender.ratings.playRecognition) / TUNING.passing.coverageTerms;
    const receiverSkill = (receiver.ratings.catching + receiver.ratings.routeRunning + receiver.ratings.separation) / TUNING.passing.receiverSkillTerms;
    const mean = TUNING.roster.starterMean;
    const contested = kind === "medium" || context.yardLine >= TUNING.scoring.redZoneLine;
    const passEdge = qb.ratings.throwAccuracy - mean + (receiverSkill - TUNING.usage.receiverSkillReference[target.group]) - TUNING.passing.coverageWeight * (coverage - TUNING.usage.coverageReference[target.group]) + TUNING.passing.throwPowerWeight[ROUTE_INDEX[kind]] * (qb.ratings.throwPower - TUNING.passing.throwPowerReference) + (contested ? TUNING.passing.catchInTrafficWeight * (receiver.ratings.catchInTraffic - TUNING.passing.catchInTrafficReference[target.group]) : 0);
    const edgeOverLeague = passEdge - TUNING.passing.passEdgeCentre;
    const ratingAdjustment = edgeOverLeague / TUNING.passing.ratingEffectDivisor;
    const coldPenalty = context.weather.tempF < TUNING.weather.extremeCold ? TUNING.passing.extremeColdCompletionPenalty : context.weather.tempF < TUNING.weather.snowTemperature ? TUNING.passing.coldCompletionPenalty : 0;
    const weatherPenalty = context.weather.windMph * TUNING.passing.windCompletionPenaltyPerMph + (context.weather.precip === "rain" ? TUNING.passing.rainCompletionPenalty : 0) + (context.weather.precip === "snow" ? TUNING.passing.snowCompletionPenalty : 0) + coldPenalty - (context.weather.indoor ? TUNING.passing.indoorCompletionBonus : 0);
    const forcedPenalty = intent.forceBall ? TUNING.passing.forcedCompletionPenalty : 0;
    const crowd = isHomeOffense ? 0 : context.crowdFactor;
    const interceptionChance = TUNING.passing.intPerAttempt * Math.exp(-TUNING.passing.intEdgePerPoint * edgeOverLeague) * interceptionFactor + crowd * TUNING.homeField.awayIntBonus + (intent.forceBall ? TUNING.passing.forcedIntBonus : 0);
    const zoneCompletion = TUNING.passing.routeZoneCompletion[cellOf(TUNING.passing.routeZones, TUNING.football.fieldLength - context.yardLine)];
    if (rng.chance(HOOKS.game ? interceptionChance * HOOKS.game.passInt(qb, defense) : interceptionChance)) {
      const interceptor = creditedDefender(defense, TUNING.credit.interceptionRoleShares, "interception", rng.next(), { covering: defender });
      return {
        ...resultBase(rng),
        yards: 0,
        type: "int",
        isTurnover: true,
        players: { passer: qb.id, receiver: receiver.id, interceptor: interceptor.id },
        ...throwFlags,
        desc: `${qb.lastName} intercepted by ${interceptor.lastName} targeting ${receiver.lastName}`
      };
    }
    const completionChance = clamp(TUNING.passing.routeCompletion[kind] * zoneCompletion[ROUTE_INDEX[kind]] * TUNING.passing.completionSituation[situation2] * completionFactor + ratingAdjustment + (isHomeOffense ? context.crowdFactor * TUNING.passing.homeRatingBoost / TUNING.passing.ratingEffectDivisor : 0) - weatherPenalty - forcedPenalty + (HOOKS.game ? HOOKS.game.passCatch(qb, receiver, defense) : 0), 0, 1);
    if (!rng.chance(completionChance)) {
      return {
        ...resultBase(rng),
        yards: 0,
        type: "incomplete",
        outOfBounds: true,
        players: { passer: qb.id, receiver: receiver.id },
        ...throwFlags,
        throwaway: false,
        desc: `Incomplete to ${receiver.lastName}`
      };
    }
    const tilt = Math.exp(TUNING.passing.yardsTiltPerPoint * (edgeOverLeague - TUNING.passing.yardsTiltOffset));
    const drawn = quantileAt(TUNING.passing.completionYards[kind], 1 - (1 - rng.next()) ** tilt);
    const yards = Math.min(Math.round(HOOKS.game ? HOOKS.game.passYards(drawn, qb, receiver, defense) : drawn), TUNING.football.fieldLength - context.yardLine);
    const credited = tacklers(defense, kind, rng);
    const isTouchdown = context.yardLine + yards >= TUNING.football.fieldLength;
    const base = {
      ...resultBase(rng),
      yards,
      type: "pass",
      isTouchdown,
      isFirstDown: yards >= context.toGo,
      outOfBounds: rng.chance(TUNING.passing.outOfBoundsChance),
      players: { passer: qb.id, receiver: receiver.id, ...tackleCredit(credited, isTouchdown) },
      ...throwFlags,
      desc: `${qb.lastName} complete to ${receiver.lastName} for ${yards} yards`
    };
    return fumbleResult(base, receiver, credited.tackler, rng);
  }
  function resolvePlay(offense, defense, intent, context, isHomeOffense, rng) {
    const penalty = penaltyResult(offense, context, rng, isHomeOffense);
    if (penalty !== null) return penalty;
    const result = intent.playType === "insideRun" || intent.playType === "outsideRun" || intent.playType === "draw" ? resolveRun(offense, defense, intent, context, rng) : resolvePass(offense, defense, intent, context, isHomeOffense, rng);
    const floor = 1 - context.yardLine;
    return result.yards < floor ? { ...result, yards: floor } : result;
  }

  // cornerstone/stats.ts
  function createTeamGameStats(teamId) {
    return {
      teamId,
      points: 0,
      totalPlays: 0,
      totalYards: 0,
      netPassingYards: 0,
      grossPassingYards: 0,
      passAttempts: 0,
      completions: 0,
      passingTouchdowns: 0,
      interceptions: 0,
      rushAttempts: 0,
      rushingYards: 0,
      rushingTouchdowns: 0,
      defensiveTouchdowns: 0,
      sacksAllowed: 0,
      sackYardsLost: 0,
      firstDowns: 0,
      passingFirstDowns: 0,
      rushingFirstDowns: 0,
      penaltyFirstDowns: 0,
      thirdDownAttempts: 0,
      thirdDownConversions: 0,
      fourthDownAttempts: 0,
      fourthDownConversions: 0,
      redZoneTrips: 0,
      redZoneTouchdowns: 0,
      penalties: 0,
      penaltyYards: 0,
      turnovers: 0,
      fumblesLost: 0,
      punts: 0,
      puntYards: 0,
      fieldGoalsAttempted: 0,
      fieldGoalsMade: 0,
      possessionSeconds: 0
    };
  }
  function createGameStatBook(home, away, players) {
    const byId = new Map(players.map((player) => [player.id, player]));
    const rosterOwners = /* @__PURE__ */ new Map();
    for (const team of [home, away]) for (const id of team.roster) {
      const player = byId.get(id);
      if (player === void 0 || player.teamId !== team.id || player.retiredYear !== null || rosterOwners.has(id)) {
        throw new Error(`invalid game roster: player ${id}, team ${team.id}`);
      }
      rosterOwners.set(id, team.id);
    }
    return { home: createTeamGameStats(home.id), away: createTeamGameStats(away.id), players: /* @__PURE__ */ new Map(), rosterOwners };
  }
  function playerLine(book, playerId) {
    let line = book.players.get(playerId);
    if (line === void 0) {
      line = {
        playerId,
        passAttempts: 0,
        completions: 0,
        passingYards: 0,
        passingTouchdowns: 0,
        interceptions: 0,
        rushAttempts: 0,
        rushingYards: 0,
        rushingTouchdowns: 0,
        targets: 0,
        receptions: 0,
        receivingYards: 0,
        receivingTouchdowns: 0,
        tackles: 0,
        sacks: 0,
        fumblesLost: 0
      };
      book.players.set(playerId, line);
    }
    return line;
  }
  function addFirstDown(stats, result) {
    if (!result.isFirstDown) return;
    stats.firstDowns += 1;
    if (result.type === "penalty") stats.penaltyFirstDowns += 1;
    else if (result.type === "pass") stats.passingFirstDowns += 1;
    else stats.rushingFirstDowns += 1;
  }
  function recordScrimmagePlay(book, offense, defense, before, result) {
    for (const [role, id] of Object.entries(result.players)) {
      const teamId = role === "tackler" || role === "assister" || role === "sacker" || role === "interceptor" ? defense.teamId : offense.teamId;
      if (id === TUNING.roster.replacementPlayerId || book.rosterOwners.get(id) !== teamId) {
        throw new Error(`invalid ${role} stat attribution: player ${id}, team ${teamId}`);
      }
    }
    if (result.type === "penalty") {
      const penalty = result.penalty;
      if (penalty !== void 0) {
        const committingTeam = penalty.onOffense ? offense : defense;
        committingTeam.penalties += 1;
        committingTeam.penaltyYards += Math.abs(penalty.yards);
        addFirstDown(offense, result);
      }
      return;
    }
    offense.totalPlays += 1;
    if (before.down === TUNING.coach.lateQuarter) offense.thirdDownAttempts += 1;
    if (before.down === TUNING.football.downs) offense.fourthDownAttempts += 1;
    if (result.isFirstDown && before.down === TUNING.coach.lateQuarter) offense.thirdDownConversions += 1;
    if (result.isFirstDown && before.down === TUNING.football.downs) offense.fourthDownConversions += 1;
    addFirstDown(offense, result);
    const passer = result.players.passer === void 0 ? void 0 : playerLine(book, result.players.passer);
    const rusher = result.players.rusher === void 0 ? void 0 : playerLine(book, result.players.rusher);
    const receiver = result.players.receiver === void 0 ? void 0 : playerLine(book, result.players.receiver);
    const sacker = result.players.sacker === void 0 ? void 0 : playerLine(book, result.players.sacker);
    const tackler = result.players.tackler === void 0 ? void 0 : playerLine(book, result.players.tackler);
    if (tackler !== void 0) tackler.tackles += 1;
    const assister = result.players.assister === void 0 ? void 0 : playerLine(book, result.players.assister);
    if (assister !== void 0) assister.tackles += 1;
    if (result.type === "pass" || result.type === "incomplete" || result.type === "int") {
      offense.passAttempts += 1;
      if (passer !== void 0) passer.passAttempts += 1;
      if (receiver !== void 0) receiver.targets += 1;
      if (result.type === "pass") {
        offense.completions += 1;
        offense.grossPassingYards += result.yards;
        offense.netPassingYards += result.yards;
        if (passer !== void 0) {
          passer.completions += 1;
          passer.passingYards += result.yards;
        }
        if (receiver !== void 0) {
          receiver.receptions += 1;
          receiver.receivingYards += result.yards;
        }
      }
      if (result.type === "int") {
        offense.interceptions += 1;
        offense.turnovers += 1;
        if (passer !== void 0) passer.interceptions += 1;
      }
    } else if (result.type === "spike") {
      offense.passAttempts += 1;
      if (passer !== void 0) passer.passAttempts += 1;
    } else if (result.type === "sack") {
      offense.sacksAllowed += 1;
      offense.sackYardsLost += Math.abs(result.yards);
      offense.netPassingYards += result.yards;
      if (sacker !== void 0) sacker.sacks += 1;
    } else if (result.type === "fumble" && passer !== void 0 && receiver !== void 0) {
      offense.passAttempts += 1;
      offense.completions += 1;
      offense.grossPassingYards += result.yards;
      offense.netPassingYards += result.yards;
      passer.passAttempts += 1;
      passer.completions += 1;
      passer.passingYards += result.yards;
      receiver.targets += 1;
      receiver.receptions += 1;
      receiver.receivingYards += result.yards;
      if (result.isTurnover) {
        offense.fumblesLost += 1;
        offense.turnovers += 1;
        receiver.fumblesLost += 1;
      }
    } else if (result.type === "run" || result.type === "scramble" || result.type === "fumble" || result.type === "kneel") {
      offense.rushAttempts += 1;
      offense.rushingYards += result.yards;
      if (rusher !== void 0) {
        rusher.rushAttempts += 1;
        rusher.rushingYards += result.yards;
      }
      if (result.type === "fumble" && result.isTurnover) {
        offense.fumblesLost += 1;
        offense.turnovers += 1;
        if (rusher !== void 0) rusher.fumblesLost += 1;
        if (receiver !== void 0) receiver.fumblesLost += 1;
      }
    }
    if (result.isTouchdown) {
      if (result.type === "pass" || result.type === "fumble" && passer !== void 0) {
        offense.passingTouchdowns += 1;
        if (passer !== void 0) passer.passingTouchdowns += 1;
        if (receiver !== void 0) receiver.receivingTouchdowns += 1;
      } else {
        offense.rushingTouchdowns += 1;
        if (rusher !== void 0) rusher.rushingTouchdowns += 1;
      }
    }
    offense.totalYards = offense.netPassingYards + offense.rushingYards;
  }
  function recordPunt(stats, yards) {
    stats.punts += 1;
    stats.puntYards += yards;
  }
  function recordFieldGoal(stats, made) {
    stats.fieldGoalsAttempted += 1;
    if (made) stats.fieldGoalsMade += 1;
  }
  function addPossessionTime(stats, seconds) {
    stats.possessionSeconds += seconds;
  }
  function addPoints(stats, points) {
    stats.points += points;
  }
  function playerStatLines(book) {
    return [...book.players.values()].sort((left, right) => left.playerId - right.playerId);
  }

  // cornerstone/gameEngine.ts
  function clamp2(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function sideTeam(runtime, side) {
    return side === "home" ? runtime.home : runtime.away;
  }
  function sideChart(runtime, side) {
    return side === "home" ? runtime.homeChart : runtime.awayChart;
  }
  function sideStats(runtime, side) {
    return side === "home" ? runtime.stats.home : runtime.stats.away;
  }
  function otherSide(side) {
    return side === "home" ? "away" : "home";
  }
  function setScore(runtime, side, points) {
    if (side === "home") runtime.context.homeScore += points;
    else runtime.context.awayScore += points;
    addPoints(sideStats(runtime, side), points);
  }
  function scoreDifference(runtime, side) {
    return side === "home" ? runtime.context.homeScore - runtime.context.awayScore : runtime.context.awayScore - runtime.context.homeScore;
  }
  function situation(context) {
    return {
      quarter: context.quarter,
      clock: context.clock,
      down: context.down,
      toGo: context.toGo,
      yardLine: context.yardLine,
      homeScore: context.homeScore,
      awayScore: context.awayScore,
      timeoutsHome: context.timeoutsHome,
      timeoutsAway: context.timeoutsAway
    };
  }
  function resetSeries(runtime, side, yardLine, cause) {
    runtime.context.possession = side;
    runtime.context.yardLine = yardLine;
    runtime.context.down = 1;
    runtime.context.toGo = Math.min(TUNING.football.firstDownYards, TUNING.football.fieldLength - yardLine);
    runtime.clockRunning = false;
    runtime.driveReachedRedZone = yardLine >= TUNING.scoring.redZoneLine;
    if (runtime.driveReachedRedZone) sideStats(runtime, side).redZoneTrips += 1;
    runtime.recorder?.record({ kind: "series", side, yardLine, quarter: runtime.context.quarter, clock: runtime.context.clock, cause });
  }
  function overtimePossessionEnded(runtime, side) {
    if (!runtime.overtime) return;
    runtime.overtimePossessions.add(side);
    if (runtime.overtimePossessions.size >= TUNING.football.overtimePossessionsRequired && runtime.context.homeScore !== runtime.context.awayScore) {
      runtime.finished = true;
    }
  }
  function changePossession(runtime, yardLine, cause) {
    const prior = runtime.context.possession;
    overtimePossessionEnded(runtime, prior);
    if (runtime.finished) return;
    resetSeries(runtime, otherSide(prior), clamp2(yardLine, 0, TUNING.football.fieldLength), cause);
  }
  function kickoff(runtime, receivingSide, cause) {
    const halfOver = runtime.context.clock === 0 && !runtime.overtime && (runtime.context.quarter === TUNING.football.firstHalfFinalQuarter || runtime.context.quarter === TUNING.football.downs);
    if (halfOver) {
      resetSeries(runtime, receivingSide, TUNING.football.kickoffTouchbackSpot, cause);
      return;
    }
    const rules = TUNING.kicking.kickoff;
    const kicking = otherSide(receivingSide);
    const at = runtime.recorder === void 0 ? null : situation(runtime.context);
    const deficit = -scoreDifference(runtime, kicking);
    const late = runtime.context.quarter === TUNING.football.downs && runtime.context.clock <= TUNING.clock.lateGameSeconds && deficit > 0;
    const onsideShare = late ? rules.onsideLateShare[cellOf(rules.onsideDeficits, deficit)] : rules.onsideOtherShare;
    const log = (event) => {
      if (at !== null) runtime.recorder?.record({ kind: "kickoff", kicking, at, ...event });
    };
    if (runtime.rng.chance(onsideShare)) {
      const recovered = runtime.rng.chance(rules.onsideRecovery);
      const yardLine2 = recovered ? rules.onsideKickingSpot : rules.onsideReceivingSpot;
      log({ onside: true, recovered, touchback: false, returned: false, returnYards: 0, returnTouchdown: false, yardLine: yardLine2 });
      resetSeries(runtime, recovered ? kicking : receivingSide, yardLine2, cause);
      return;
    }
    const roll = runtime.rng.next();
    if (roll < rules.touchbackRate) {
      log({ onside: false, recovered: false, touchback: true, returned: false, returnYards: 0, returnTouchdown: false, yardLine: TUNING.football.kickoffTouchbackSpot });
      resetSeries(runtime, receivingSide, TUNING.football.kickoffTouchbackSpot, cause);
      return;
    }
    if (roll >= rules.touchbackRate + rules.returnRate) {
      log({ onside: false, recovered: false, touchback: false, returned: false, returnYards: 0, returnTouchdown: false, yardLine: rules.otherSpot });
      resetSeries(runtime, receivingSide, rules.otherSpot, cause);
      return;
    }
    if (runtime.rng.chance(rules.returnTouchdownRate)) {
      const returnYards = Math.round(TUNING.football.fieldLength - rules.catchSpot);
      log({ onside: false, recovered: false, touchback: false, returned: true, returnYards, returnTouchdown: true, yardLine: null });
      specialTeamsTouchdown(runtime, receivingSide, cause);
      return;
    }
    const yardLine = clamp2(Math.round(quantileAt(rules.returnStart, runtime.rng.next())), 1, TUNING.football.fieldLength - 1);
    log({ onside: false, recovered: false, touchback: false, returned: true, returnYards: Math.max(0, Math.round(yardLine - rules.catchSpot)), returnTouchdown: false, yardLine });
    resetSeries(runtime, receivingSide, yardLine, cause);
  }
  function transitionPeriod(runtime) {
    if (runtime.context.quarter >= TUNING.football.downs) return;
    runtime.context.quarter += 1;
    runtime.context.clock = TUNING.football.quarterSeconds;
    runtime.context.isTwoMinute = false;
    if (runtime.context.quarter === TUNING.coach.lateQuarter) {
      runtime.context.timeoutsHome = TUNING.football.startingTimeouts;
      runtime.context.timeoutsAway = TUNING.football.startingTimeouts;
      kickoff(runtime, otherSide(runtime.firstHalfReceiver), "halftime");
    }
  }
  function consumeClock(runtime, requested, offense) {
    let used = Math.min(runtime.context.clock, Math.max(0, Math.round(requested)));
    const warning = TUNING.football.twoMinuteSeconds;
    const warningQuarter = runtime.context.quarter === TUNING.football.firstHalfFinalQuarter || runtime.context.quarter === TUNING.football.downs;
    if (warningQuarter && runtime.context.clock > warning && runtime.context.clock - used < warning) {
      used = runtime.context.clock - warning;
      runtime.clockRunning = false;
    }
    runtime.context.clock -= used;
    addPossessionTime(sideStats(runtime, offense), used);
    runtime.context.isTwoMinute = warningQuarter && runtime.context.clock <= TUNING.football.twoMinuteSeconds;
  }
  function lateInHalf(quarter, clock) {
    return quarter === TUNING.football.firstHalfFinalQuarter && clock <= TUNING.football.twoMinuteSeconds || quarter >= TUNING.football.downs && clock <= TUNING.clock.lateGameSeconds;
  }
  function useTimeout(runtime, side) {
    const key = side === "home" ? "timeoutsHome" : "timeoutsAway";
    if (runtime.context[key] <= 0) return false;
    runtime.context[key] -= 1;
    return true;
  }
  function runoffFor(runtime, result, intent, offense, before) {
    const endsSeries = result.isTouchdown || result.isTurnover || result.type !== "penalty" && before.down === TUNING.football.downs && !result.isFirstDown && before.yardLine + result.yards < TUNING.football.fieldLength;
    if (endsSeries || result.type === "incomplete" || result.type === "spike" || result.outOfBounds && lateInHalf(before.quarter, before.clock)) return 0;
    if (result.type === "penalty") return lateInHalf(before.quarter, before.clock) ? 0 : TUNING.clock.penaltyRunoff;
    let runoff = intent.drainClock ? TUNING.clock.drainClockRunoff : intent.tempo >= TUNING.coach.turboTempo ? TUNING.clock.hurryUpRunoff : intent.noHuddle ? TUNING.clock.noHuddleRunoff : intent.tempo > TUNING.coach.riskScale * TUNING.coach.neutral ? TUNING.clock.mediumRunoff : TUNING.clock.normalRunoff;
    if (runtime.overtime && runtime.context.homeScore === runtime.context.awayScore) {
      runoff = TUNING.clock.hurryUpRunoff;
    }
    const defense = otherSide(offense);
    const quarter = runtime.context.quarter;
    const endOfHalf = quarter === TUNING.football.firstHalfFinalQuarter && runtime.context.clock <= TUNING.football.twoMinuteSeconds;
    const lateGame = quarter >= TUNING.football.downs && runtime.context.clock <= TUNING.clock.lateGameSeconds;
    const lastTwo = quarter >= TUNING.football.downs && runtime.context.clock <= TUNING.football.twoMinuteSeconds;
    const stopped = lateGame && scoreDifference(runtime, defense) < 0 && (lastTwo || runtime.rng.chance(TUNING.clock.lateDefenseTimeoutChance)) && useTimeout(runtime, defense) || endOfHalf && runtime.rng.chance(TUNING.clock.halfDefenseTimeoutChance) && useTimeout(runtime, defense) || endOfHalf && runtime.rng.chance(TUNING.clock.halfOffenseTimeoutChance) && useTimeout(runtime, offense) || quarter >= TUNING.football.downs && runtime.context.clock <= TUNING.football.twoMinuteSeconds && scoreDifference(runtime, offense) <= 0 && runtime.rng.chance(TUNING.clock.hurryOffenseTimeoutChance) && useTimeout(runtime, offense) || !endOfHalf && !lateGame && runtime.rng.chance(TUNING.clock.ordinaryTimeoutRate) && useTimeout(runtime, runtime.rng.chance(TUNING.clock.offenseTimeoutShare) ? offense : defense);
    if (stopped) return 0;
    return Math.max(0, runoff * (1 + runtime.context.tempoEnvironment));
  }
  function updateRedZone(runtime, side, beforeYardLine) {
    if (!runtime.driveReachedRedZone && beforeYardLine < TUNING.scoring.redZoneLine && runtime.context.yardLine >= TUNING.scoring.redZoneLine && runtime.context.yardLine < TUNING.football.fieldLength) {
      runtime.driveReachedRedZone = true;
      sideStats(runtime, side).redZoneTrips += 1;
    }
  }
  function shouldTryTwo(runtime, side) {
    if (runtime.context.quarter < TUNING.football.downs) return runtime.rng.chance(TUNING.kicking.twoPointTryEarly);
    const reach = TUNING.kicking.twoPointLeads;
    const lead = clamp2(scoreDifference(runtime, side), -reach, reach);
    return runtime.rng.chance(TUNING.kicking.twoPointTryFourthQuarter[lead + reach]);
  }
  function conversionTry(runtime, side) {
    const pointsBeforeTry = sideStats(runtime, side).points;
    const beforeTry = runtime.recorder === void 0 ? null : situation(runtime.context);
    const twoPoint = shouldTryTwo(runtime, side);
    if (twoPoint) {
      if (runtime.rng.chance(TUNING.kicking.twoPointRate)) setScore(runtime, side, TUNING.football.twoPointPoints);
    } else if (runtime.rng.chance(TUNING.kicking.extraPointRate)) {
      setScore(runtime, side, TUNING.football.extraPointPoints);
    }
    if (beforeTry !== null) {
      runtime.recorder?.record({ kind: "conversion", side, twoPoint, made: sideStats(runtime, side).points > pointsBeforeTry, at: beforeTry });
    }
  }
  function tryUnlessWalkOff(runtime, side, endsNow) {
    if (runtime.overtime && endsNow && scoreDifference(runtime, side) > 0) return;
    conversionTry(runtime, side);
  }
  function touchdown(runtime, side) {
    setScore(runtime, side, TUNING.football.touchdownPoints);
    runtime.recorder?.record({ kind: "touchdown", side, defensive: false });
    if (runtime.driveReachedRedZone) sideStats(runtime, side).redZoneTouchdowns += 1;
    tryUnlessWalkOff(runtime, side, (/* @__PURE__ */ new Set([...runtime.overtimePossessions, side])).size >= TUNING.football.overtimePossessionsRequired);
    overtimePossessionEnded(runtime, side);
    if (!runtime.finished) kickoff(runtime, otherSide(side), "touchdown");
  }
  function returnTouchdown(runtime, scoringSide) {
    const scoredOn = otherSide(scoringSide);
    setScore(runtime, scoringSide, TUNING.football.touchdownPoints);
    sideStats(runtime, scoringSide).defensiveTouchdowns += 1;
    runtime.recorder?.record({ kind: "touchdown", side: scoringSide, defensive: true });
    tryUnlessWalkOff(runtime, scoringSide, true);
    if (runtime.overtime && runtime.context.homeScore !== runtime.context.awayScore) {
      runtime.finished = true;
      return;
    }
    overtimePossessionEnded(runtime, scoredOn);
    if (!runtime.finished) kickoff(runtime, scoredOn, "returnTouchdown");
  }
  function specialTeamsTouchdown(runtime, side, cause) {
    setScore(runtime, side, TUNING.football.touchdownPoints);
    runtime.recorder?.record({ kind: "touchdown", side, defensive: false, specialTeams: true });
    tryUnlessWalkOff(runtime, side, true);
    if (runtime.overtime && runtime.context.homeScore !== runtime.context.awayScore) {
      runtime.finished = true;
      return;
    }
    kickoff(runtime, otherSide(side), cause);
  }
  function safety(runtime, offense) {
    const defense = otherSide(offense);
    setScore(runtime, defense, TUNING.football.safetyPoints);
    runtime.recorder?.record({ kind: "safety", side: defense });
    overtimePossessionEnded(runtime, offense);
    if (!runtime.finished) kickoff(runtime, defense, "safety");
  }
  function applyScrimmage(runtime, result, intent) {
    const side = runtime.context.possession;
    const defense = otherSide(side);
    const offenseStats = sideStats(runtime, side);
    const before = { ...runtime.context, weather: { ...runtime.context.weather } };
    recordScrimmagePlay(runtime.stats, offenseStats, sideStats(runtime, defense), before, result);
    runtime.snaps += 1;
    const runoff = runoffFor(runtime, result, intent, side, before);
    runtime.clockRunning = runoff > 0;
    runtime.recorder?.record({
      kind: "snap",
      offense: side,
      at: situation(before),
      playType: intent.playType,
      tempo: intent.tempo,
      drainClock: intent.drainClock,
      forceBall: intent.forceBall,
      noHuddle: intent.noHuddle,
      result: {
        ...result,
        players: { ...result.players },
        ...result.penalty === void 0 ? {} : { penalty: { ...result.penalty } }
      },
      runoff,
      timeoutsHomeAfter: runtime.context.timeoutsHome,
      timeoutsAwayAfter: runtime.context.timeoutsAway
    });
    consumeClock(runtime, result.clockUsed + runoff, side);
    const backedUp = TUNING.scoring.safetyYardLines.findIndex((limit) => before.yardLine <= limit);
    if (backedUp >= 0 && runtime.rng.chance(TUNING.scoring.safetyRate[backedUp])) {
      safety(runtime, side);
      return;
    }
    if (result.type === "penalty") {
      runtime.context.yardLine = clamp2(runtime.context.yardLine + result.yards, 1, TUNING.football.fieldLength);
      runtime.context.toGo = Math.max(1, runtime.context.toGo - result.yards);
      if (result.isFirstDown) {
        runtime.context.down = 1;
        runtime.context.toGo = Math.min(TUNING.football.firstDownYards, TUNING.football.fieldLength - runtime.context.yardLine);
      }
      updateRedZone(runtime, side, before.yardLine);
      return;
    }
    runtime.context.yardLine = clamp2(runtime.context.yardLine + result.yards, 0, TUNING.football.fieldLength);
    runtime.context.toGo -= result.yards;
    updateRedZone(runtime, side, before.yardLine);
    if (result.isTouchdown || runtime.context.yardLine >= TUNING.football.fieldLength) {
      touchdown(runtime, side);
      return;
    }
    if (result.isTurnover) {
      const returnChance = result.type === "int" ? TUNING.scoring.interceptionReturnTouchdown : TUNING.scoring.fumbleReturnTouchdown;
      if (runtime.rng.chance(returnChance)) {
        returnTouchdown(runtime, defense);
        return;
      }
      changePossession(runtime, TUNING.football.fieldLength - runtime.context.yardLine, "turnover");
      return;
    }
    if (result.isFirstDown || runtime.context.toGo <= 0) {
      runtime.context.down = 1;
      runtime.context.toGo = Math.min(TUNING.football.firstDownYards, TUNING.football.fieldLength - runtime.context.yardLine);
      return;
    }
    runtime.context.down += 1;
    if (runtime.context.down > TUNING.football.downs) {
      changePossession(runtime, TUNING.football.fieldLength - runtime.context.yardLine, "downs");
    }
  }
  function fieldGoalRate(distance, kicker, weather) {
    const bucketIndex = TUNING.kicking.distanceBuckets.findIndex((limit) => distance < limit);
    const rateIndex = bucketIndex < 0 ? TUNING.kicking.distanceRates.length - 1 : bucketIndex;
    const base = TUNING.kicking.distanceRates[rateIndex];
    const rating = (kicker.ratings.kickAccuracy - TUNING.roster.starterMean) / TUNING.kicking.ratingEffectDivisor;
    const weatherPenalty = weather.indoor ? 0 : weather.windMph * TUNING.kicking.windPenaltyPerMph;
    return clamp2(base + rating - weatherPenalty, TUNING.kicking.minAttemptRate, TUNING.kicking.maxAttemptRate);
  }
  function maxFieldGoalDistance(kicker) {
    return TUNING.kicking.baseMaxDistance + Math.round((kicker.ratings.kickPower - TUNING.kicking.powerBaseline) / TUNING.kicking.powerDistanceDivisor);
  }
  function attemptFieldGoal(runtime, side, late) {
    const chart = sideChart(runtime, side);
    const kicker = chart.get("K");
    const distance = TUNING.football.fieldLength - runtime.context.yardLine + TUNING.football.endZoneAndHoldYards;
    const made = runtime.rng.chance(fieldGoalRate(distance, kicker, runtime.context.weather));
    runtime.recorder?.record({ kind: "fieldGoal", offense: side, at: situation(runtime.context), distance, made, late });
    recordFieldGoal(sideStats(runtime, side), made);
    consumeClock(runtime, TUNING.clock.fieldGoalSeconds, side);
    if (made) {
      setScore(runtime, side, TUNING.football.fieldGoalPoints);
      overtimePossessionEnded(runtime, side);
      if (!runtime.finished) kickoff(runtime, otherSide(side), "fieldGoal");
    } else {
      changePossession(runtime, TUNING.football.fieldLength - runtime.context.yardLine, "missedFieldGoal");
    }
  }
  function puntLandingMean(yardsToGoal) {
    const { snapMean, landingMean } = TUNING.kicking.punt;
    if (yardsToGoal <= snapMean[0]) return landingMean[0];
    for (let index = 1; index < snapMean.length; index += 1) {
      const high = snapMean[index];
      if (yardsToGoal <= high) {
        const low = snapMean[index - 1];
        const from = landingMean[index - 1];
        return from + (yardsToGoal - low) / (high - low) * (landingMean[index] - from);
      }
    }
    return landingMean[landingMean.length - 1];
  }
  function punt(runtime, side) {
    const before = runtime.recorder === void 0 ? null : situation(runtime.context);
    const table = TUNING.kicking.punt;
    const yardsToGoal = TUNING.football.fieldLength - runtime.context.yardLine;
    const cell = cellOf(table.yardsToGoal, yardsToGoal);
    const punter = sideChart(runtime, side).get("P");
    const ratingBonus = (punter.ratings.kickPower - TUNING.roster.starterMean) / TUNING.football.overtimePossessionsRequired;
    const roll = runtime.rng.next();
    const touchbackRate = table.touchbackRate[cell];
    if (roll < touchbackRate) {
      const drawn = Math.round(clamp2(runtime.rng.gauss(table.grossMean[cell] + ratingBonus, table.grossSd[cell]), TUNING.kicking.puntMin, TUNING.kicking.puntMax));
      const gross2 = Math.max(drawn, yardsToGoal);
      recordPunt(sideStats(runtime, side), gross2);
      consumeClock(runtime, TUNING.clock.puntSeconds, side);
      if (before !== null) runtime.recorder?.record({ kind: "punt", offense: side, at: before, gross: gross2, touchback: true, fairCatch: false, returnYards: 0, returnTouchdown: false });
      changePossession(runtime, TUNING.football.puntTouchbackSpot, "punt");
      return;
    }
    const landingToGoal = clamp2(Math.round(runtime.rng.gauss(puntLandingMean(yardsToGoal) - ratingBonus, table.landingSd[cell])), 1, yardsToGoal - 1);
    const gross = yardsToGoal - landingToGoal;
    recordPunt(sideStats(runtime, side), gross);
    consumeClock(runtime, TUNING.clock.puntSeconds, side);
    const fairCatch = roll < touchbackRate + table.fairCatchRate[cell];
    if (!fairCatch && runtime.rng.chance(table.returnTouchdownRate)) {
      if (before !== null) runtime.recorder?.record({ kind: "punt", offense: side, at: before, gross, touchback: false, fairCatch: false, returnYards: TUNING.football.fieldLength - landingToGoal, returnTouchdown: true });
      overtimePossessionEnded(runtime, side);
      if (!runtime.finished) specialTeamsTouchdown(runtime, otherSide(side), "returnTouchdown");
      return;
    }
    const returnYards = fairCatch ? 0 : Math.round(quantileAt(table.returnYards, runtime.rng.next()));
    const start = clamp2(landingToGoal + returnYards, 1, TUNING.football.fieldLength - 1);
    if (before !== null) runtime.recorder?.record({ kind: "punt", offense: side, at: before, gross, touchback: false, fairCatch, returnYards: start - landingToGoal, returnTouchdown: false });
    changePossession(runtime, start, "punt");
  }
  function fourthDownCall(runtime, side) {
    const table = TUNING.kicking.fourthDown;
    const team = sideTeam(runtime, side);
    const yardsToGoal = TUNING.football.fieldLength - runtime.context.yardLine;
    const late = runtime.context.quarter === TUNING.football.downs && runtime.context.clock <= TUNING.clock.lateGameSeconds;
    const deficit = -scoreDifference(runtime, side);
    let go;
    let fieldGoal;
    if (late) {
      const zone = cellOf(table.lateYardsToGoal, yardsToGoal);
      if (deficit > 0) {
        const row = cellOf(table.lateDeficits, deficit);
        go = table.lateGoRate[row]?.[zone];
        fieldGoal = table.lateFieldGoalShare[row]?.[zone];
      } else {
        go = table.lateLevelGoRate[zone];
        fieldGoal = table.lateLevelFieldGoalShare[zone];
      }
    } else {
      const row = cellOf(table.toGo, runtime.context.toGo);
      const zone = cellOf(table.yardsToGoal, yardsToGoal);
      go = table.goRate[row]?.[zone];
      fieldGoal = table.fieldGoalShare[row]?.[zone];
    }
    const bound = TUNING.kicking.goRateBound;
    const logit = Math.log(clamp2(go, bound, 1 - bound) / (1 - clamp2(go, bound, 1 - bound))) + TUNING.kicking.goAggressionLogit * (team.scheme.aggressiveness - TUNING.coach.neutral) / TUNING.coach.profileSd;
    if (runtime.rng.chance(1 / (1 + Math.exp(-logit)))) return "go";
    const kicker = sideChart(runtime, side).get("K");
    const inRange = yardsToGoal + TUNING.football.endZoneAndHoldYards <= maxFieldGoalDistance(kicker);
    return inRange && runtime.rng.chance(fieldGoal) ? "fieldGoal" : "punt";
  }
  function handleFourthDown(runtime) {
    const side = runtime.context.possession;
    const team = sideTeam(runtime, side);
    const chart = sideChart(runtime, side);
    const call = fourthDownCall(runtime, side);
    if (call === "go") {
      const intent = selectPlay(team.scheme, runtime.context, side === "home", runtime.rng);
      const result = resolvePlay(chart, sideChart(runtime, otherSide(side)), intent, runtime.context, side === "home", runtime.rng);
      applyScrimmage(runtime, result, intent);
    } else if (call === "fieldGoal") {
      attemptFieldGoal(runtime, side, false);
    } else {
      punt(runtime, side);
    }
  }
  function shouldAttemptLateFieldGoal(runtime, side) {
    const difference = scoreDifference(runtime, side);
    if (runtime.overtime) {
      if (runtime.overtimePossessions.size < TUNING.football.overtimePossessionsRequired || difference !== 0 || runtime.context.clock > TUNING.kicking.overtimeLateKickClock) return false;
    } else {
      const lastPlay = runtime.context.clock <= TUNING.kicking.lastPlayKickClock || runtime.clockRunning && runtime.context.clock <= TUNING.kicking.lastPlayKickClock + TUNING.clock.playClockNormal;
      if (runtime.context.quarter !== TUNING.football.downs || !lastPlay) return false;
    }
    if (difference > 0 || difference < -TUNING.football.fieldGoalPoints) return false;
    const kicker = sideChart(runtime, side).get("K");
    const distance = TUNING.football.fieldLength - runtime.context.yardLine + TUNING.football.endZoneAndHoldYards;
    return distance <= maxFieldGoalDistance(kicker);
  }
  function attemptLateFieldGoal(runtime, side) {
    const drain = Math.max(0, runtime.context.clock - TUNING.kicking.lateKickRemainingClock);
    if (drain > 0) consumeClock(runtime, drain, side);
    attemptFieldGoal(runtime, side, true);
  }
  function kneelResult(runtime) {
    const quarterback = sideChart(runtime, runtime.context.possession).get("QB");
    return {
      yards: -1,
      clockUsed: TUNING.clock.snapToWhistleMin,
      type: "kneel",
      isTurnover: false,
      isTouchdown: false,
      isFirstDown: false,
      outOfBounds: false,
      players: { rusher: quarterback.id },
      desc: `${quarterback.lastName} kneels`
    };
  }
  function canKneel(runtime, side) {
    const { quarter, clock, down, yardLine } = runtime.context;
    if (quarter === TUNING.football.firstHalfFinalQuarter) {
      return clock <= TUNING.clock.halfKneelClock && yardLine < TUNING.clock.halfKneelYardLine && down < TUNING.football.downs;
    }
    if (quarter !== TUNING.football.downs || scoreDifference(runtime, side) <= 0) return false;
    const opponentTimeouts = side === "home" ? runtime.context.timeoutsAway : runtime.context.timeoutsHome;
    const kneelsLeft = TUNING.football.downs - down;
    return clock <= Math.max(0, kneelsLeft - opponentTimeouts) * TUNING.clock.kneelSeconds;
  }
  function spikeResult(runtime) {
    const quarterback = sideChart(runtime, runtime.context.possession).get("QB");
    return {
      yards: 0,
      clockUsed: TUNING.clock.spikeSeconds,
      type: "spike",
      isTurnover: false,
      isTouchdown: false,
      isFirstDown: false,
      outOfBounds: false,
      players: { passer: quarterback.id },
      desc: `${quarterback.lastName} spikes the ball`
    };
  }
  function shouldSpike(runtime, side) {
    const { quarter, clock, down } = runtime.context;
    const timeouts = side === "home" ? runtime.context.timeoutsHome : runtime.context.timeoutsAway;
    const hurrying = quarter === TUNING.football.firstHalfFinalQuarter || quarter === TUNING.football.downs && scoreDifference(runtime, side) <= 0;
    return hurrying && runtime.clockRunning && timeouts === 0 && clock <= TUNING.clock.spikeClock && down < TUNING.football.downs - 1 && runtime.rng.chance(TUNING.clock.spikeChance);
  }
  function runCurrentPeriod(runtime) {
    while (!runtime.finished && runtime.snaps < TUNING.season.maximumGameSnaps) {
      if (runtime.context.clock === 0) {
        if (runtime.overtime || runtime.context.quarter >= TUNING.football.downs) return;
        if (runtime.pauseAtQuarterEnd) return;
        transitionPeriod(runtime);
      }
      const side = runtime.context.possession;
      if (shouldAttemptLateFieldGoal(runtime, side)) {
        attemptLateFieldGoal(runtime, side);
      } else if (canKneel(runtime, side)) {
        const intent = {
          playType: "insideRun",
          riskTolerance: 0,
          tempo: 0,
          forceBall: false,
          drainClock: true,
          noHuddle: false,
          maxReads: 1
        };
        applyScrimmage(runtime, kneelResult(runtime), intent);
      } else if (shouldSpike(runtime, side)) {
        const intent = {
          playType: "shortPass",
          riskTolerance: 0,
          tempo: TUNING.coach.turboTempo,
          forceBall: false,
          drainClock: false,
          noHuddle: false,
          maxReads: 1
        };
        applyScrimmage(runtime, spikeResult(runtime), intent);
      } else if (runtime.context.down === TUNING.football.downs) {
        handleFourthDown(runtime);
      } else {
        const team = sideTeam(runtime, side);
        const intent = selectPlay(team.scheme, runtime.context, side === "home", runtime.rng);
        const result = resolvePlay(sideChart(runtime, side), sideChart(runtime, otherSide(side)), intent, runtime.context, side === "home", runtime.rng);
        applyScrimmage(runtime, result, intent);
      }
    }
  }
  function simulateGame(home, away, players, scheduleGame, weather, rng, recorder) {
    const firstHalfReceiver = rng.chance(TUNING.coach.neutral) ? "home" : "away";
    const context = {
      homeScore: 0,
      awayScore: 0,
      quarter: 1,
      clock: TUNING.football.quarterSeconds,
      down: 1,
      toGo: TUNING.football.firstDownYards,
      yardLine: TUNING.football.kickoffTouchbackSpot,
      possession: firstHalfReceiver,
      weather,
      // A labeled fork keeps the pre-existing play stream stable. One draw per game, shared by
      // both teams, in yards of drive-starting field position. Distinct from weather, which is
      // already modeled.
      tempoEnvironment: rng.fork("scoring-environment").gauss(
        0,
        TUNING.scoring.gameScriptTempoSd
      ),
      crowdFactor: TUNING.homeField.crowdFactor,
      isTwoMinute: false,
      timeoutsHome: TUNING.football.startingTimeouts,
      timeoutsAway: TUNING.football.startingTimeouts
    };
    const runtime = {
      context,
      home,
      away,
      // Stage 3 (DEPTH W1): each side's form draws on labelled forks, so the play stream is untouched.
      homeChart: buildDepthChart(home, players, rng.fork("form:home")),
      awayChart: buildDepthChart(away, players, rng.fork("form:away")),
      stats: createGameStatBook(home, away, players),
      rng,
      firstHalfReceiver,
      driveReachedRedZone: false,
      overtimePossessions: /* @__PURE__ */ new Set(),
      overtime: false,
      finished: false,
      snaps: 0,
      clockRunning: false,
      recorder
    };
    recorder?.record({
      kind: "gameStart",
      gameId: scheduleGame.id,
      week: scheduleGame.week,
      homeTeamId: home.id,
      awayTeamId: away.id,
      weather: { ...weather },
      receiving: firstHalfReceiver,
      yardLine: context.yardLine
    });
    kickoff(runtime, firstHalfReceiver, "opening");
    while (runtime.context.quarter <= TUNING.football.downs && runtime.context.clock > 0 && !runtime.finished) runCurrentPeriod(runtime);
    if (runtime.context.homeScore === runtime.context.awayScore) {
      runtime.overtime = true;
      runtime.context.quarter = TUNING.football.downs + 1;
      runtime.context.clock = TUNING.football.overtimeSeconds;
      runtime.context.isTwoMinute = false;
      runtime.context.timeoutsHome = TUNING.football.startingTimeouts;
      runtime.context.timeoutsAway = TUNING.football.startingTimeouts;
      kickoff(runtime, rng.chance(TUNING.coach.neutral) ? "home" : "away", "overtime");
      runCurrentPeriod(runtime);
    }
    recorder?.record({ kind: "gameEnd", homeScore: runtime.context.homeScore, awayScore: runtime.context.awayScore, overtime: runtime.overtime });
    return {
      id: scheduleGame.id,
      week: scheduleGame.week,
      homeTeamId: home.id,
      awayTeamId: away.id,
      homeScore: runtime.context.homeScore,
      awayScore: runtime.context.awayScore,
      overtime: runtime.overtime,
      tie: runtime.context.homeScore === runtime.context.awayScore,
      homeStats: runtime.stats.home,
      awayStats: runtime.stats.away,
      playerStats: playerStatLines(runtime.stats)
    };
  }

  // cornerstone/rng.ts
  function mulberry32(seed) {
    const rootSeed = seed >>> 0;
    let a = rootSeed;
    const next = () => {
      a = a + 1831565813 >>> 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    return {
      next,
      int(min, max) {
        if (max < min) throw new RangeError("max must be greater than or equal to min");
        return Math.floor(next() * (max - min + 1)) + min;
      },
      pick(arr) {
        if (arr.length === 0) throw new RangeError("cannot pick from an empty array");
        return arr[Math.floor(next() * arr.length)];
      },
      chance(p) {
        return next() < Math.max(0, Math.min(1, p));
      },
      gauss(mean, sd) {
        let u = 0;
        let v = 0;
        while (u === 0) u = next();
        while (v === 0) v = next();
        return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      },
      fork(label) {
        let hash = 2166136261 ^ rootSeed;
        for (let index = 0; index < label.length; index += 1) {
          hash ^= label.charCodeAt(index);
          hash = Math.imul(hash, 16777619);
        }
        return mulberry32(hash >>> 0);
      }
    };
  }

  // game.ts
  var ROUTES = ["screen", "short", "medium", "deep"];
  var RUNS = ["inside", "outside", "draw", "power"];
  var CONFIG = {
    routeMix: { screen: 0.199, short: 0.454, medium: 0.215, deep: 0.131 },
    runMix: { inside: 0.354, outside: 0.441, draw: 0.121, power: 0.084 },
    // Two real backs: the share of their carries split by overall, and its weight a point of overall
    // (0.05: 6 points apart is 57/43, 20 apart 73/27).
    backOverallShare: 0.5,
    backOverallPerPoint: 0.05
  };
  var lean = {};
  var routeWeight = {};
  function configure(settings = {}) {
    Object.assign(CONFIG, settings);
    lean = {};
    routeWeight = {};
    TUNING.usage.targetGroups.forEach((group, index) => {
      const share = (kind) => TUNING.usage.targetGroupShare[kind][index];
      const overall = ROUTES.reduce((sum, kind) => sum + CONFIG.routeMix[kind] * share(kind), 0);
      lean[group] = Object.fromEntries(ROUTES.map((kind) => [kind, share(kind) / overall]));
      routeWeight[group] = Object.fromEntries(ROUTES.map((kind) => [kind, CONFIG.routeMix[kind] * lean[group][kind]]));
    });
  }
  configure();
  var USAGE = {
    targetWeight(option, kind, fitness) {
      const volume = option.player.usage ? option.player.usage.targets : 0;
      if (!(volume > 0)) return 0;
      const w = routeWeight[option.group];
      const average2 = ROUTES.reduce((sum, route) => sum + w[route] * fitness(route), 0);
      return volume * lean[option.group][kind] * fitness(kind) / average2;
    },
    backCarries(candidates, backShare, score, fitness) {
      const backs = candidates.filter((c) => c.group === "RB");
      const weights = backs.map((c) => {
        const volume = c.player.usage ? c.player.usage.carries : 0;
        if (!(volume > 0)) return 0;
        const average2 = RUNS.reduce((sum, run) => sum + CONFIG.runMix[run] * fitness(c.player, run), 0);
        return volume * fitness(c.player, score) / average2;
      });
      const own = backs.map((c, i) => i).filter((i) => backs[i].player.usage && backs[i].player.usage.own && weights[i] > 0);
      if (own.length > 1) {
        const together = own.reduce((sum, i) => sum + weights[i], 0);
        const top = Math.max(...own.map((i) => backs[i].player.overall));
        const byOverall = own.map((i) => Math.exp(CONFIG.backOverallPerPoint * (backs[i].player.overall - top)));
        const overallSum = byOverall.reduce((a, b) => a + b, 0);
        const split = CONFIG.backOverallShare;
        own.forEach((i, k) => {
          weights[i] = together * ((1 - split) * weights[i] / together + split * byOverall[k] / overallSum);
        });
      }
      const total = weights.reduce((a, b) => a + b, 0);
      backs.forEach((c, i) => {
        c.weight = total > 0 ? backShare * weights[i] / total : 0;
      });
    },
    runShift(rusher, defense) {
      return edgeOf(rusher).run + unitOf(defense).run;
    },
    passCatch(qb, receiver, defense) {
      return edgeOf(qb).catch + edgeOf(receiver).catch + unitOf(defense).catch;
    },
    passInt(qb, defense) {
      return edgeOf(qb).int * unitOf(defense).int;
    },
    passYards(drawn, qb, receiver, defense) {
      return drawn > 0 ? drawn * edgeOf(qb).yards * edgeOf(receiver).yards * unitOf(defense).yards : drawn;
    }
  };
  var NO_EDGE = { run: 0, catch: 0, yards: 1, int: 1 };
  var edgeOf = (player) => player.edge || NO_EDGE;
  var unitOf = (defense) => defense.getGroup("DB").unit || NO_EDGE;
  function withUsage(on, fn) {
    const saved = HOOKS.game;
    HOOKS.game = on ? USAGE : null;
    try {
      return fn();
    } finally {
      HOOKS.game = saved;
    }
  }
  function driveLog(rt) {
    let open = null;
    let lastKick = null;
    let onside = null;
    const Q = TUNING.football.quarterSeconds;
    const now = () => ({ q: rt.context.quarter, c: rt.context.clock });
    const elapsed = (a, b) => a.q === b.q ? a.c - b.c : (b.q - a.q - 1) * Q + a.c + (Q - b.c);
    const start = (side, result = null) => ({ side, result, detail: null, plays: 0, yards: 0, at: now(), play: null, last: null, onside });
    const byCause = { downs: "DOWNS", halftime: "HALF", overtime: "END", punt: "PUNT", missedFieldGoal: "MISSED_FG", fieldGoal: "FG", touchdown: "TD", safety: "SAFETY" };
    function close(fallback) {
      if (!open) return;
      const d = open;
      open = null;
      const result = d.result || fallback;
      if (d.plays === 0 && (result === "HALF" || result === "END")) return;
      rt.log.push({
        side: d.side,
        result,
        detail: d.detail,
        plays: d.plays,
        yards: d.yards,
        secs: Math.max(0, elapsed(d.at, now())),
        score: [rt.context.homeScore, rt.context.awayScore],
        play: d.play || d.last,
        onside: d.onside
      });
    }
    return {
      record(e) {
        switch (e.kind) {
          case "series":
            if (open) close(e.cause === "turnover" ? open.last && open.last.type === "int" ? "INT" : "FUMBLE" : byCause[e.cause] || "END");
            open = start(e.side);
            onside = null;
            break;
          case "snap":
            if (!open) open = start(e.offense);
            if (e.result.type !== "penalty") open.plays += 1;
            open.yards += e.result.yards;
            open.last = e.result;
            if (e.result.isTurnover) open.play = e.result;
            break;
          case "touchdown":
            if (e.specialTeams && !(lastKick && lastKick.kind === "punt" && open)) {
              close("END");
              open = start(e.side, "KR_TD");
            } else if (open) {
              open.result = e.specialTeams ? "PR_TD" : e.defensive ? open.last && open.last.type === "int" ? "INT_TD" : "FUM_TD" : "TD";
              if (!e.specialTeams) open.play = open.last;
            }
            break;
          case "conversion":
            if (open) open.detail = e.twoPoint ? e.made ? "2PT" : "2PT_FAIL" : e.made ? null : "XP_MISS";
            break;
          case "fieldGoal":
            if (open) {
              open.result = e.made ? "FG" : "MISSED_FG";
              open.detail = e.distance;
            }
            break;
          case "punt":
            lastKick = e;
            if (open) {
              open.result = "PUNT";
              open.detail = e.gross;
            }
            break;
          case "kickoff":
            lastKick = e;
            close("END");
            if (e.onside) onside = e.recovered ? "recovered" : "failed";
            break;
          case "safety":
            if (open) open.result = "SAFETY";
            break;
        }
      },
      closeOpen(result) {
        close(result);
      }
    };
  }
  var NEUTRAL_WEATHER = { tempF: 60, windMph: 5, precip: "none", indoor: false };
  function createGame(home, away, players, rng, opts = {}) {
    return withUsage(!!opts.usage, () => startGame(home, away, players, rng, opts));
  }
  function startGame(home, away, players, rng, opts) {
    const neutral = !!opts.neutral;
    const firstHalfReceiver = rng.chance(TUNING.coach.neutral) ? "home" : "away";
    const weather = neutral ? Object.assign({}, NEUTRAL_WEATHER, opts.weather || {}) : opts.weather;
    const context = {
      homeScore: 0,
      awayScore: 0,
      quarter: 1,
      clock: TUNING.football.quarterSeconds,
      down: 1,
      toGo: TUNING.football.firstDownYards,
      yardLine: TUNING.football.kickoffTouchbackSpot,
      possession: firstHalfReceiver,
      weather,
      tempoEnvironment: neutral ? opts.tempo || 0 : rng.fork("scoring-environment").gauss(0, TUNING.scoring.gameScriptTempoSd),
      crowdFactor: neutral ? 0 : TUNING.homeField.crowdFactor,
      isTwoMinute: false,
      timeoutsHome: TUNING.football.startingTimeouts,
      timeoutsAway: TUNING.football.startingTimeouts
    };
    const rt = {
      context,
      home,
      away,
      homeChart: buildDepthChart(home, players, rng.fork("form:home")),
      awayChart: buildDepthChart(away, players, rng.fork("form:away")),
      stats: createGameStatBook(home, away, players),
      rng,
      firstHalfReceiver,
      driveReachedRedZone: false,
      overtimePossessions: /* @__PURE__ */ new Set(),
      overtime: false,
      finished: false,
      snaps: 0,
      clockRunning: false,
      recorder: void 0,
      pauseAtQuarterEnd: true,
      usage: !!opts.usage,
      log: [],
      logger: null,
      otPeriods: 0
    };
    if (opts.log) rt.logger = driveLog(rt);
    const sinks = [rt.logger, opts.recorder].filter(Boolean);
    if (sinks.length) rt.recorder = { record: (e) => {
      for (const s of sinks) s.record(e);
    } };
    if (opts.scheduleGame) {
      rt.recorder?.record({
        kind: "gameStart",
        gameId: opts.scheduleGame.id,
        week: opts.scheduleGame.week,
        homeTeamId: home.id,
        awayTeamId: away.id,
        weather: { ...weather },
        receiving: firstHalfReceiver,
        yardLine: context.yardLine
      });
    }
    kickoff(rt, firstHalfReceiver, "opening");
    return rt;
  }
  function playQuarter(rt) {
    return withUsage(rt.usage, () => stepQuarter(rt));
  }
  function stepQuarter(rt) {
    const c = rt.context;
    if (rt.overtime || rt.finished || c.quarter >= TUNING.football.downs && c.clock === 0) return false;
    if (c.clock === 0) transitionPeriod(rt);
    rt.pauseAtQuarterEnd = true;
    runCurrentPeriod(rt);
    if (rt.logger && c.clock === 0 && (c.quarter === TUNING.football.firstHalfFinalQuarter || c.quarter === TUNING.football.downs)) {
      rt.logger.closeOpen(c.quarter === TUNING.football.downs ? "END" : "HALF");
    }
    return true;
  }
  function playOvertimePeriod(rt) {
    withUsage(rt.usage, () => stepOvertime(rt));
  }
  function stepOvertime(rt) {
    const c = rt.context;
    rt.overtime = true;
    rt.otPeriods += 1;
    c.quarter = TUNING.football.downs + 1;
    c.clock = TUNING.football.overtimeSeconds;
    c.isTwoMinute = false;
    c.timeoutsHome = TUNING.football.startingTimeouts;
    c.timeoutsAway = TUNING.football.startingTimeouts;
    if (rt.otPeriods > 1) {
      rt.overtimePossessions = /* @__PURE__ */ new Set();
      rt.finished = false;
    }
    kickoff(rt, rt.rng.chance(TUNING.coach.neutral) ? "home" : "away", "overtime");
    runCurrentPeriod(rt);
    if (rt.logger) rt.logger.closeOpen("END");
  }
  function simulateGame2(home, away, players, rng, opts = {}) {
    const rt = createGame(home, away, players, rng, opts);
    while (playQuarter(rt)) {
    }
    const periods = opts.maxOvertimes ?? 3;
    for (let n = 0; n < periods && rt.context.homeScore === rt.context.awayScore; n += 1) playOvertimePeriod(rt);
    return rt;
  }
  return __toCommonJS(game_exports);
})();
if (typeof module !== "undefined") module.exports = ENGINE;
