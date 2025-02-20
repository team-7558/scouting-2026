import {
  GAME_LOCATIONS,
  PHASES,
  ACTIONS,
  GAME_PIECES,
  COLORS,
} from "./Constants";

import AlgaeIcon from "../../assets/scouting-2025/algaeIcon.png";
import CoralIcon from "../../assets/scouting-2025/coralIcon.png";
import { ImageIcon, StartingPositionSlider } from "./CustomFieldComponents";

const createTask = (action, gamepiece = null) => ({
  action: action,
  gamepiece: gamepiece,
});

export const SCOUTING_CONFIG = {
  CORAL_MARK: {
    phases: [PHASES.AUTO],
    drawBorder: (match, key) =>
      (!match.hasCoral() && match.coral.attainedLocation == key) ||
      (!match.hasAlgae() && match.algae.attainedLocation == key),
    disabled: (match, key) => match.hasCoral() && match.hasAlgae(),
    isCircle: true,
    color: COLORS.ALGAEPICKUP,
    positions: {
      [GAME_LOCATIONS.CORAL_MARK.LEFT]: [250, 450],
      [GAME_LOCATIONS.CORAL_MARK.MIDDLE]: [250, 800],
      [GAME_LOCATIONS.CORAL_MARK.RIGHT]: [250, 1175],
    },
    dimensions: {
      width: 200,
      height: 200,
    },
    tasks: [
      createTask(ACTIONS.ACQUIRE, GAME_PIECES.CORAL),
      createTask(ACTIONS.ACQUIRE, GAME_PIECES.ALGAE),
    ],
    textFunction: (match, key) => "",
  },

  // Coral Station: two positions; task is to acquire CORAL.
  CORAL_STATION: {
    phases: [PHASES.AUTO, PHASES.TELE],
    drawBorder: (match, key) =>
      !match.hasCoral() && match.coral.attainedLocation == key,
    disabled: (match, key) => match.hasCoral(),
    positions: {
      [GAME_LOCATIONS.CORAL_STATION.LEFT]: [225, 125],
      [GAME_LOCATIONS.CORAL_STATION.RIGHT]: [225, 1475],
    },
    dimensions: {
      width: 450,
      height: 250,
    },
    tasks: [createTask(ACTIONS.ACQUIRE, GAME_PIECES.CORAL)],

    textFunction: (match, key) => key.replaceAll("_", " "),
  },

  REEF: {
    phases: [PHASES.AUTO, PHASES.TELE],
    color: COLORS.CORALDROPOFF,
    drawBorder: (match, key) =>
      match.coral.depositLocation == key ||
      (!match.hasAlgae() && match.algae.attainedLocation == key),
    disabled: (match, key) => !match.hasCoral() && match.hasAlgae(),
    positions: {
      [GAME_LOCATIONS.REEF.AB]: [665, 800],
      [GAME_LOCATIONS.REEF.CD]: [780, 1000],
      [GAME_LOCATIONS.REEF.EF]: [1020, 1000],
      [GAME_LOCATIONS.REEF.GH]: [1135, 800],
      [GAME_LOCATIONS.REEF.IJ]: [1020, 600],
      [GAME_LOCATIONS.REEF.KL]: [780, 600],
    },
    isCircle: true,
    dimensions: {
      width: 200,
      height: 200,
    },
    tasks: [
      createTask(ACTIONS.DEPOSIT, GAME_PIECES.CORAL),
      createTask(ACTIONS.ACQUIRE, GAME_PIECES.ALGAE),
    ],

    textFunction: (match, key) => key.split("_")[1],
  },

  PROCESSOR: {
    phases: [PHASES.AUTO, PHASES.TELE],
    drawBorder: (match, key) => match.algae.depositLocation == key,
    disabled: (match, key) => !match.hasAlgae(),
    positions: {
      [GAME_LOCATIONS.PROCESSOR]: [1200, 1500],
    },
    dimensions: {
      width: 500,
      height: 200,
    },
    tasks: [createTask(ACTIONS.DEPOSIT, GAME_PIECES.ALGAE)],
    textFunction: (match, key) => key,
  },

  [GAME_LOCATIONS.NET]: {
    phases: [PHASES.AUTO, PHASES.TELE],
    drawBorder: (match, key) => match.algae.depositLocation == key,
    disabled: (match, key) => !match.hasAlgae(),
    positions: {
      [GAME_LOCATIONS.NET]: [1755, 375],
    },
    dimensions: {
      width: 300,
      height: 750,
    },
    tasks: [createTask(ACTIONS.DEPOSIT, GAME_PIECES.ALGAE)],
    textFunction: (match, key) => key,
  },

  // Hang: three positions; task is to hang.
  HANG: {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: {
      [GAME_LOCATIONS.HANG.LEFT]: [1755, 1000],
      [GAME_LOCATIONS.HANG.MIDDLE]: [1755, 1225],
      [GAME_LOCATIONS.HANG.RIGHT]: [1755, 1450],
    },
    dimensions: {
      width: 250,
      height: 200,
    },
    tasks: [createTask(ACTIONS.HANG)],
    textFunction: (match, key) => key.replaceAll("_", " "),
  },

  GO_TELE: {
    phases: [PHASES.AUTO],
    positions: {
      TELE: [2050, 850],
    },
    dimensions: {
      width: 250,
      height: 250,
    },
    tasks: [createTask(ACTIONS.GO_TELE)],
    textFunction: (match, key) => key,
  },

  CORAL_ICON: {
    phases: [PHASES.PRE_MATCH, PHASES.AUTO],
    showFunction: (match, key) => match.hasCoral(),
    positions: {
      TELE: [2050, 200],
    },
    dimensions: {
      width: 200,
      height: 200,
    },
    tasks: [createTask(ACTIONS.GO_TELE)],
    componentFunction: (match, key) => ImageIcon(CoralIcon),
  },

  ALGAE_ICON: {
    phases: [PHASES.PRE_MATCH, PHASES.AUTO],
    showFunction: (match, key) => match.hasAlgae(),
    positions: {
      TELE: [2050, 350],
    },
    dimensions: {
      width: 200,
      height: 200,
    },
    tasks: [createTask(ACTIONS.GO_TELE)],
    componentFunction: (match, key) => ImageIcon(AlgaeIcon),
  },

  STARTING_LINE: {
    phases: [PHASES.PRE_MATCH],
    positions: {
      0: [1515, 655],
    },
    dimensions: {
      width: 0,
      height: 1310,
    },
    tasks: [createTask(ACTIONS.GO_TELE)],
    componentFunction: (match, key) => StartingPositionSlider(match),
  },

  GO_DEFENSE: {
    phases: [PHASES.TELE],
    positions: {
      DEFENSE: [2050, 850],
    },
    dimensions: {
      width: 250,
      height: 250,
    },
    tasks: [createTask(ACTIONS.GO_DEFENSE)],
    textFunction: (match, key) => key,
  },

  GO_POST_MATCH: {
    phases: [PHASES.TELE],
    positions: {
      POST_MATCH: [2050, 1300],
    },
    dimensions: {
      width: 250,
      height: 250,
    },
    tasks: [createTask(ACTIONS.GO_POST_MATCH)],
    textFunction: (match, key) => "POST MATCH",
  },
};
