import {
  GAME_LOCATIONS,
  PHASES,
  ACTIONS,
  GAME_PIECES,
  COLORS,
} from "./Constants";

import { StartingPositionSlider } from "./CustomFieldComponents";

// const createTask = (action, gamepiece = null) => ({
//   action: action,
//   gamepiece: gamepiece,
// });

export const SCOUTING_CONFIG = {
  PREPLACED_POWER_CELL: {
    phases: [PHASES.AUTO, PHASES.PRE_MATCH],
    drawBorder: (match, key) => true,
    disabled: (match, key) => false,
    isCircle: true,
    color: COLORS.POWERCELLPICKUP,
    positions: {
      [GAME_LOCATIONS.PREPLACED_POWER_CELL.TRENCH_RUN.FORWARD]: [250, 450],
    },
    dimensions: {
      width: 200,
      height: 200,
    },
    textFunction: (match, key) => "",
  },
};

// export const SCOUTING_CONFIG = {
//   CORAL_MARK: {
//     phases: [PHASES.AUTO],
//     drawBorder: (match, key) =>
//       (!match.hasCoral() && match.coral.attainedLocation == key) ||
//       (!match.hasAlgae() && match.algae.attainedLocation == key),
//     disabled: (match, key) => match.hasCoral() && match.hasAlgae(),
//     isCircle: true,
//     color: COLORS.ALGAEPICKUP,
//     positions: {
//       [GAME_LOCATIONS.CORAL_MARK.LEFT]: [250, 450],
//       [GAME_LOCATIONS.CORAL_MARK.MIDDLE]: [250, 800],
//       [GAME_LOCATIONS.CORAL_MARK.RIGHT]: [250, 1175],
//     },
//     dimensions: {
//       width: 200,
//       height: 200,
//     },
//     tasks: [
//       createTask(ACTIONS.ACQUIRE, GAME_PIECES.CORAL),
//       createTask(ACTIONS.ACQUIRE, GAME_PIECES.ALGAE),
//     ],
//     textFunction: (match, key) => "",
//   },

//   // Coral Station: two positions; task is to acquire CORAL.
//   CORAL_STATION: {
//     phases: [PHASES.AUTO, PHASES.TELE],
//     drawBorder: (match, key) =>
//       !match.hasCoral() && match.coral.attainedLocation == key,
//     disabled: (match, key) => match.hasCoral(),
//     positions: {
//       [GAME_LOCATIONS.CORAL_STATION.LEFT]: [225, 125],
//       [GAME_LOCATIONS.CORAL_STATION.RIGHT]: [225, 1475],
//     },
//     dimensions: {
//       width: 450,
//       height: 250,
//     },
//     tasks: [createTask(ACTIONS.ACQUIRE_AND_FINISH, GAME_PIECES.CORAL)],

//     textFunction: (match, key) => key.replaceAll("_", " "),
//   },

//   REEF: {
//     phases: [PHASES.AUTO, PHASES.TELE],
//     color: COLORS.CORALDROPOFF,
//     drawBorder: (match, key) =>
//       match.coral.depositLocation == key ||
//       (!match.hasAlgae() && match.algae.attainedLocation == key),
//     disabled: (match, key) => !match.hasCoral(),
//     positions: {
//       [GAME_LOCATIONS.REEF.AB]: [665, 800],
//       [GAME_LOCATIONS.REEF.CD]: [780, 1000],
//       [GAME_LOCATIONS.REEF.EF]: [1020, 1000],
//       [GAME_LOCATIONS.REEF.GH]: [1135, 800],
//       [GAME_LOCATIONS.REEF.IJ]: [1020, 600],
//       [GAME_LOCATIONS.REEF.KL]: [780, 600],
//     },
//     isCircle: true,
//     dimensions: {
//       width: 200,
//       height: 200,
//     },
//     tasks: [
//       createTask(ACTIONS.DEPOSIT, GAME_PIECES.CORAL),
//     ],

//     textFunction: (match, key) => key.split("_")[1],
//   },

//   REEF_ALGAE_PICKUP: {
//     phases: [PHASES.AUTO, PHASES.TELE],
//     color: COLORS.ALGAEPICKUP,
//     drawBorder: (match, key) => match.algae.attainedLocation=="REEF_ALGAE" && !match.hasAlgae(),
//     disabled: (match, key) => match.hasAlgae(),
//     positions: {[GAME_LOCATIONS.REEF.ALGAE]: [900, 800]},
//     isCircle: true,
//     dimensions: {
//       width: 200,
//       height: 200
//     },
//     tasks: [
//       createTask(ACTIONS.ACQUIRE_AND_FINISH, GAME_PIECES.ALGAE),
//     ],
//   },

//   PROCESSOR: {
//     phases: [PHASES.AUTO, PHASES.TELE],
//     drawBorder: (match, key) => match.algae.depositLocation == key,
//     disabled: (match, key) => !match.hasAlgae(),
//     positions: {
//       [GAME_LOCATIONS.PROCESSOR]: [1200, 1500],
//     },
//     dimensions: {
//       width: 500,
//       height: 200,
//     },
//     tasks: [createTask(ACTIONS.DEPOSIT, GAME_PIECES.ALGAE)],
//     textFunction: (match, key) => key,
//   },

//   OPPONENT_PROCESSOR: {
//     phases: [PHASES.AUTO, PHASES.TELE],
//     drawBorder: (match, key) => match.algae.depositLocation == key,
//     color: COLORS.OPPONENT,
//     disabled: (match, key) => !match.hasAlgae(),
//     positions: {
//       [GAME_LOCATIONS.OPPONENT_PROCESSOR]: [2310, 100],
//     },
//     dimensions: {
//       width: 500,
//       height: 200,
//     },
//     tasks: [createTask(ACTIONS.DEPOSIT, GAME_PIECES.ALGAE)],
//     textFunction: (match, key) => key.replace("_", " "),
//   },

//   [GAME_LOCATIONS.NET]: {
//     phases: [PHASES.AUTO, PHASES.TELE],
//     drawBorder: (match, key) => match.algae.depositLocation == key,
//     disabled: (match, key) => !match.hasAlgae(),
//     showFunction: (match, key) => match.hang.startTime == null,
//     positions: {
//       [GAME_LOCATIONS.NET]: [1755, 525],
//     },
//     dimensions: {
//       width: 300,
//       height: 450,
//     },
//     tasks: [createTask(ACTIONS.DEPOSIT, GAME_PIECES.ALGAE)],
//     textFunction: (match, key) => key,
//   },

//   START_HANG: {
//     phases: [PHASES.TELE],
//     disabled: (match, key) => match.hang.startTime != null,
//     showFunction: (match, key) => match.hang.startTime == null,
//     positions: {
//       START_HANG: [1755, 125],
//     },
//     dimensions: {
//       width: 300,
//       height: 300,
//     },
//     tasks: [createTask(ACTIONS.HANG_ENTER)],
//     textFunction: (match, key) => key.replaceAll("_", " "),
//   },

//   // Hang: three positions; task is to hang.
//   HANG: {
//     phases: [PHASES.TELE],
//     drawBorder: (match, key) => match.hang?.cageLocation == key,
//     disabled: (match, key) => match.hang.startTime == null,
//     showFunction: (match, key) => match.hang.startTime != null,
//     positions: {
//       [GAME_LOCATIONS.HANG.LEFT]: [1755, 140],
//       [GAME_LOCATIONS.HANG.MIDDLE]: [1755, 370],
//       [GAME_LOCATIONS.HANG.RIGHT]: [1755, 600],
//     },
//     dimensions: {
//       width: 250,
//       height: 200,
//     },
//     tasks: [createTask(ACTIONS.HANG_CAGE_TOUCH)],
//     textFunction: (match, key) => key.replaceAll("_", " "),
//   },

//   GO_TELE: {
//     phases: [PHASES.AUTO],
//     positions: {
//       TELE: [2050, 850],
//     },
//     dimensions: {
//       width: 250,
//       height: 250,
//     },
//     tasks: [createTask(ACTIONS.GO_TELE)],
//     textFunction: (match, key) => "FINISH AUTO",
//   },

//   STARTING_LINE: {
//     phases: [PHASES.PRE_MATCH],
//     positions: {
//       PRELOAD: [1515, 655],
//     },
//     dimensions: {
//       width: 0,
//       height: 1310,
//     },
//     tasks: [createTask(ACTIONS.GO_TELE)],
//     componentFunction: (match, key) => StartingPositionSlider(match),
//   },

//   GO_DEFENSE: {
//     phases: [PHASES.TELE],
//     positions: {
//       DEFENSE: [2050, 850],
//     },
//     dimensions: {
//       width: 250,
//       height: 250,
//     },
//     tasks: [createTask(ACTIONS.GO_DEFENSE)],
//     textFunction: (match, key) => key,
//     disabled: (match, key) => match.contact.startTime != null,
//   },

//   GO_POST_MATCH: {
//     phases: [PHASES.TELE],
//     positions: {
//       POST_MATCH: [2050, 1300],
//     },
//     dimensions: {
//       width: 250,
//       height: 250,
//     },
//     tasks: [createTask(ACTIONS.GO_POST_MATCH)],
//     textFunction: (match, key) => "POST MATCH",
//   },

//   ROBOT_LEFT_STARTING: {
//     showFunction: (match, key) => match.autoMovement.startTime != null,
//     phases: [PHASES.AUTO],
//     positions: {
//       ROBOT_LEFT_STARTING: [756, 805],
//     },
//     dimensions: {
//       width: 1515,
//       height: 1610,
//     },
//     tasks: [createTask(ACTIONS.ROBOT_LEFT_STARTING)],
//     textFunction: (match, key) => "ROBOT LEFT STARTING ZONE",
//   },
// };
