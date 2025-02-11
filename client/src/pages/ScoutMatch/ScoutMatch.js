import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  createContext,
} from "react";
import { useCallback } from "react";

import { ThemeProvider } from "@mui/material/styles";
import Slider from "@mui/material/Slider";
import { BlueTheme } from "./themes/BlueTheme.js";

import { Box, Button } from "@mui/material";
import { FieldCanvas, FieldLocalComponent } from "../FieldCanvas.js";
import FullscreenDialog from "./FullScreenDialog.js";

import AlgaeIcon from "../../assets/scouting-2025/algaeIcon.png";
import CoralIcon from "../../assets/scouting-2025/coralIcon.png";

const COLORS = {
  PENDING: "info",
  SUCCESS: "success",
  DISABLED: "disabled",
  ACTIVE: "primary",
  CORALPICKUP: "coralPickup",
  CORALDROPOFF: "coralDropoff",
  ALGAEPICKUP: "algaePickup",
  ALGAEDROPOFF: "algaeDropoff",
  CANCEL: "cancel",
};

// Canvas Helpers
const sidebarVirtualWidth = 1100;
const virtualWidth = 3510 + sidebarVirtualWidth;
const virtualHeight = 1610;
const aspectRatio = 16 / 9;

const MatchContext = createContext();

// Scout Match Component
const ScoutMatch = ({ driverStation, teamNumber, scoutPerspective }) => {
  const createFieldLocalMatchComponent = (
    id,
    fieldX,
    fieldY,
    fieldWidth,
    fieldHeight,
    componentFunction
  ) => {
    return (
      <MatchContext.Consumer key={id}>
        {(match) => (
          <FieldLocalComponent
            fieldX={fieldX - fieldWidth / 2}
            fieldY={fieldY - fieldHeight / 2}
            fieldWidth={fieldWidth}
            fieldHeight={fieldHeight}
          >
            {componentFunction(match)}
          </FieldLocalComponent>
        )}
      </MatchContext.Consumer>
    );
  };

  const context = useContext(MatchContext);
  // match state
  const [matchStartTime, setMatchStartTime] = useState(-1);
  const [currentTime, setCurrentTime] = useState(0);
  const PHASES = { 
    PREMATCH: "prematch", 
    AUTO: "auto", 
    TELE: "tele", 
    ENDGAME: "endgame", 
    POSTMATCH: "postmatch" };
  const [phase, setPhase] = useState(PHASES.PREMATCH);

  // robot state
  const [isDefending, setIsDefending] = useState(false);
  const [startingPosition, setStartingPosition] = useState(-1);

  const [coral, setCoral] = useState({
    attainedLocation: null,
    attainedTime: null,

    depositLocation: null,
    depositTime: null,
  });

  const [algae, setAlgae] = useState({
    attainedLocation: null, // if not null, pickup is pending
    attainedTime: null, // if not null, holding gamepiece

    depositLocation: null,
    depositTime: null,
  });

  const [defense, setDefense] = useState({
    defendingTeam: null,
    startTime: null,
    endTime: null,
  });

  const [hang, setHang] = useState({
    time: null,
    position: null,
    height: null,
  });

  const [endgame, setEndgame] = useState({
    disabled: false,
    driverSkill: "N/A",
    defenseSkill: "N/A",
    role: "N/A",
    comments: "",
  });


  //TODO: replace with real teams.
  const allies = [7558, 188, 1325];
  const enemies = [2056, 4039, 9785];

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        matchStartTime > 0 &&
        (currentTime < 15 || (phase === PHASES.TELE && currentTime < 150))
      ) {
        setCurrentTime((prevTime) => prevTime + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [matchStartTime, phase, currentTime]);

  useEffect(() => {
    if (coral.depositTime != null) {
      console.log("coral cycle: " + JSON.stringify(coral));
      // TODO Update cycles when scored
      updateCoral({});
    }
  }, [coral]);

  useEffect(() => {
    if (algae.depositTime != null) {
      console.log("algae cycle: " + JSON.stringify(algae));
      // TODO Update cycles when scored
      setAlgae({});
    }
  }, [algae]);

  useEffect(() => {
    if (defense.endTime != null) {
      console.log("defense cycle: " + JSON.stringify(defense));
      setDefense({});
    }
  }, [defense]);

  useEffect(() => {
    if (hang.time != null) {
      console.log("Hang: " + JSON.stringify(hang));
      setHang({});
    }
  }, [hang]);

  // TODO add sanity checks here
  const updateCoral = (updates) => {
    // intentially re-writing the entire state,
    // the caller of this method should decide if it wants to include prior state
    setCoral(updates);
  };

  const hasCoral = () => {
    return coral.attainedTime != null;
  };

  const hasAlgae = () => {
    return algae.attainedTime != null;
  };

  // TODO add sanity checks here
  const updateAlgae = (updates) => {
    // intentially re-writing the entire state,
    // the caller of this method should decide if it wants to include prior state
    setAlgae(updates);
  };

  const CONTEXT_WRAPPER = {
    matchStartTime,
    setMatchStartTime,
    phase,
    setPhase,
    isDefending,
    setIsDefending,
    startingPosition,
    setStartingPosition,
    coral,
    setCoral,
    algae,
    setAlgae,
    updateCoral,
    updateAlgae,
    hasCoral,
    hasAlgae,
  };

  const fieldCanvasRef = useRef(null);
  const scaledBoxRef = useRef(null);
  const [scaledBoxRect, setScaledBoxRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const scaleWidthToActual = (virtualValue) =>
    (virtualValue / virtualWidth) * scaledBoxRect.width;

  const scaleHeightToActual = (virtualValue) =>
    (virtualValue / virtualHeight) * scaledBoxRect.height;

  const FieldButton = ({ children, sx, ...props }) => {
    return (
      <Button
        variant="contained"
        sx={{
          ...sx,
          width: "100%",
          height: "100%",
          minWidth: 0,
          minHeight: 0,
          padding: 0,
          margin: 0,
        }}
        {...props}
      >
        {children}
      </Button>
    );
  };

  const StartingPositionSlider = (match) => {
    const fieldRef = fieldCanvasRef.current;
    if (!fieldRef) return;
    return (
      <Slider
        orientation="vertical"
        value={match.startingPosition}
        onChange={(event, value) => match.setStartingPosition(value)}
        min={1}
        max={13}
        step={1}
        valueLabelDisplay="auto"
        sx={{
          "margin-top": fieldRef.scaleHeightToActual(150),
          "margin-bottom": fieldRef.scaleHeightToActual(150),
          "& .MuiSlider-thumb": {
            "background-image": `url(
            "https://i.imgur.com/TqGjfyf.jpg"
          )`,
            width: fieldRef.scaleWidthToActual(300),
            height: fieldRef.scaleHeightToActual(300),
            "background-position": "center",
            "background-size": "cover",
            "border-radius": 0,
          },
          "& .MuiSlider-track": {
            color: startingPosition == -1 ? COLORS.DISABLED : COLORS.ACTIVE,
          },
          "& .MuiSlider-rail": {
            color: startingPosition == -1 ? COLORS.DISABLED : COLORS.ACTIVE,
          },
        }}
      />
    );
  };

  const PrematchChildren = [
    createFieldLocalMatchComponent(
      "startingPositionSlider",
      1750,
      655,
      75,
      1310,
      StartingPositionSlider
    ),
  ];

  const AutoChildren = [
    // Coral Mark Buttons
    ...[450, 800, 1175].map((y, index) => {
      const drawBorder =
        (coral.attainedLocation?.includes("coralMark" + index) &&
          !hasCoral()) ||
        (algae.attainedLocation?.includes("coralMark" + index) && !hasAlgae());
      return createFieldLocalMatchComponent(
        `coralMark${index}`,
        290,
        y,
        250,
        200,
        (match) => (
          <FieldButton
            color={COLORS.SUCCESS}
            sx={{
              borderRadius: "50%",
              border: drawBorder
                ? scaleWidthToActual(50) + "px solid black"
                : "",
            }}
            disabled={match.hasAlgae() && match.hasCoral()}
            onClick={() => {
              if (!match.hasCoral()) {
                setCoral({
                  attainedLocation: "coralMark" + index,
                  attainedTime: null,
                  depositLocation: null,
                  depositTime: null,
                });
              } else if (coral.depositTime == null) {
                setCoral({
                  ...coral,
                  depositLocation: null,
                });
              }
              if (!match.hasAlgae()) {
                setAlgae({
                  attainedLocation: "coralMark" + index,
                  attainedTime: null,
                  depositLocation: null,
                  depositTime: null,
                });
              } else {
                setAlgae({ ...algae, depositLocation: null });
              }

              setHang({});
            }}
          ></FieldButton>
        )
      );
    }),

    //go to tele
    createFieldLocalMatchComponent(
      "nextPhase",
      2150,
      850,
      300,
      200,
      (match) => (
        <FieldButton
          color={COLORS.ACTIVE}
          onClick={() => {
            setPhase(PHASES.TELE);
          }}
        >
          TELE
        </FieldButton>
      )
    ),
  ];

  const AutoTeleChildren = [
    //coral stations
    ...[125, 1475].map((y, index) => {
      const drawBorder =
        !hasCoral() &&
        coral?.attainedLocation?.includes(
          (index == 0 ? "left" : "right") + "CoralStation"
        );
      return createFieldLocalMatchComponent(
        "coralStation" + index,
        225,
        y,
        450,
        250,
        (match) => (
          <FieldButton
            color={COLORS.ACTIVE}
            disabled={match.hasCoral()}
            onClick={() => {
              match.setCoral({
                attainedLocation:
                  (index == 0 ? "left" : "right") + "CoralStation",
                attainedTime: null,
                depositLocation: null,
                depositTime: null,
              });

              if (!match.hasAlgae()) {
                setAlgae({});
              } else {
                setAlgae({ ...algae, depositLocation: null });
              }
              setHang({});
            }}
            sx={{
              border: drawBorder
                ? scaleWidthToActual(50) + "px solid black"
                : "",
            }}
          >
            {index == 0 ? "Left" : "Right"} Coral Station
          </FieldButton>
        )
      );
    }),

    // Reef Buttons
    ...[600, 600, 790, 1000, 1000, 790].map((y, index) => {
      const x = [930, 1250, 1380, 1250, 930, 830][index];
      const drawBorder =
        (coral?.depositLocation?.includes("reef") &&
          coral.depositTime == null &&
          coral.depositLocation?.includes(index)) ||
        (!hasAlgae() &&
          algae.attainedLocation?.includes("reef") &&
          algae.attainedLocation?.includes(index));

      return createFieldLocalMatchComponent(
        `${index}ReefButton`,
        x,
        y,
        250,
        200,
        (match) => (
          <FieldButton
            color={COLORS.PENDING}
            disabled={!match.hasCoral() && match.hasAlgae()}
            onClick={() => {
              if (match.hasCoral()) {
                setCoral({
                  attainedLocation: coral.attainedLocation,
                  attainedTime: coral.attainedTime,
                  depositLocation: "reef" + index,
                  depositTime: null,
                });
              } else {
                setCoral({
                  attainedLocation: null,
                  attainedTime: null,
                  depositLocation: "reef" + index,
                  depositTime: null,
                });
              }

              if (!match.hasAlgae()) {
                setAlgae({
                  attainedLocation: "reef" + index,
                  attainedTime: null,
                  depositLocation: null,
                  depositTime: null,
                });
              }else if (algae.depositTime==null){
                setAlgae({...algae, depositLocation: null});
              }

              setHang({});
            }}
            sx={{
              borderRadius: "50%",
              border: drawBorder
                ? scaleWidthToActual(50) + "px solid black"
                : "",
            }}
          ></FieldButton>
        )
      );
    }),

    // Algae Scores - Proccessor
    createFieldLocalMatchComponent(
      "scoreProcessor",
      1750,
      1500,
      500,
      200,
      (match) => (
        <FieldButton
          color={COLORS.ACTIVE}
          disabled={!match.hasAlgae()}
          onClick={() => {
            setAlgae({
              attainedLocation: algae.attainedLocation,
              attainedTime: algae.attainedTime,
              depositLocation: "processor",
              depositTime: null,
            });

            if (!match.hasCoral()) {
              setCoral({});
            } else if (coral.depositTime == null) {
              setCoral({
                ...coral,
                depositLocation: null,
              });
            }

            setHang({});
          }}
        >
          Score Processor
        </FieldButton>
      )
    ),

    // Algae Scores - Net
    createFieldLocalMatchComponent("scoreNet", 2150, 375, 300, 750, (match) => (
      <FieldButton
        color={COLORS.ACTIVE}
        disabled={!match.hasAlgae()}
        onClick={() => {
          setAlgae({
            attainedLocation: algae.attainedLocation,
            attainedTime: algae.attainedTime,
            depositLocation: "net",
            depositTime: null,
          });

          if (!match.hasCoral()) {
            setCoral({});
          } else if (coral.depositTime == null) {
            setCoral({
              ...coral,
              depositLocation: null,
            });
          }

          setHang({});
        }}
      >
        Score Net
      </FieldButton>
    )),

    //timer
    createFieldLocalMatchComponent("timer", 2500, 50, 300, 100, (match) => (
      <p
        style={{
          fontSize: "2em",
          fontWeight: 1000,
          color: "rgb(0, 0, 0)",
          backgroundColor: "rgb(255, 255, 255)",
        }}
      >
        {currentTime}
      </p>
    )),
  ];

  const AlgaeCoralIcons = [
    //coral icon
    createFieldLocalMatchComponent(
      "coralIcon",
      2500,
      300,
      400,
      200,
      (match) => (
        <span
          style={{
            display: "block",
            overflow: "hidden",
            visibility: match.hasCoral() ? "visible" : "hidden",
            pointerEvents: "none",
          }}
        >
          <img
            src={CoralIcon}
            alt="CORAL ICON NOT FOUND"
            style={{
              display: "block",
              objectFit: "cover",
              height: "100%",
              width: "100%",
              pointerEvents: "none",
            }}
          ></img>
        </span>
      )
    ),

    //algae icon
    createFieldLocalMatchComponent(
      "algaeIcon",
      2500,
      450,
      400,
      200,
      (match) => (
        <span
          style={{
            display: "block",
            overflow: "hidden",
            visibility: algae.attainedTime != null ? "visible" : "hidden",
            pointerEvents: "none",
          }}
        >
          <img
            src={AlgaeIcon}
            alt="ALGAE ICON NOT FOUND"
            style={{
              display: "block",
              objectFit: "cover",
              height: "100%",
              width: "100%",
              pointerEvents: "none",
            }}
          ></img>
        </span>
      )
    ),
  ];

  // Check each on field click to draw a green box. TODO: make the green box small coral/algae images
  const markerPositions = [
    coral?.attainedLocation,
    coral?.depositLocation,
    algae?.attainedLocation,
    algae?.depositLocation,
  ];
  for (let index = 0; index < markerPositions.length; index++) {
    const location = markerPositions[index];
    if (Array.isArray(location)) {
      AutoTeleChildren.push(
        createFieldLocalMatchComponent(
          "clickMarker" + index,
          location[0],
          location[1],
          100,
          100,
          (match) => (
            <FieldButton
              variant="contained"
              color={COLORS.SUCCESS}
            ></FieldButton>
          )
        )
      );
    }
  }

  const TeleChildren = [
    // defense button
    createFieldLocalMatchComponent("defense", 2500, 900, 300, 280, (match) => (
      <FieldButton
        color={COLORS.PRIMARY}
        onClick={() => {
          if (isDefending && defense.endTime==null){
            setDefense({...defense, endTime: currentTime})
          }
          setIsDefending(!isDefending);

        }}
      >
        {isDefending ? "Cycle" : "Defend"}
      </FieldButton>
    )),

    // Hang buttons
    ...[1000, 1225, 1450].map((y, index) => {
      const drawBorder = hang.position === index;
      return createFieldLocalMatchComponent(
        `hang${index}`,
        2150,
        y,
        250,
        200,
        (match) => (
          <FieldButton
            color={COLORS.PENDING}
            sx={{
              border: drawBorder
                ? scaleWidthToActual(30) + "px solid black"
                : scaleWidthToActual(15) + "px solid black",
            }}
            onClick={(match) => {
              setHang({
                ...hang,
                position: index,
              });

              if (hasCoral()) {
                setCoral({ ...coral, depositLocation: null });
              } else {
                setCoral({});
              }

              if (hasAlgae()) {
                setAlgae({ ...algae, depositLocation: null });
              } else {
                setAlgae({});
              }
            }}
          >
            HANG {index + 1}
          </FieldButton>
        )
      );
    }),

    // post-match button
    createFieldLocalMatchComponent(
      "postMatch", 
      2500, 
      1300, 
      300, 
      280, 
      (match) => (
      <FieldButton
        color={COLORS.PRIMARY}
        onClick={() => setPhase(PHASES.POSTMATCH)}
      >
        POST MATCH
      </FieldButton>
    )),
  ]


  const PostMatchChildren = [    
    // Disabled
    createFieldLocalMatchComponent(
      "disabled",
      250,
      100,
      500,
      150,
      (match) => (
        <FieldButton
          color={COLORS.PRIMARY}
          sx={{
            fontSize: scaleWidthToActual(80) + "px",
          }}
        >
          DISABLED?
        </FieldButton>
      )
    ),

    // Disabled Options
    ...[150, 600].map((x, index) => {
      const value = ["no", "yes"][index];
      const drawBorder = endgame.disabled===(value==="yes" ? true : false);
      return createFieldLocalMatchComponent(
        `${index}DisabledMenu`,
        x,
        250,
        300,
        100,
        (match) => (
          <FieldButton
            color={COLORS.PENDING}
            onClick={() => {setEndgame({...endgame, disabled: value==="yes"});}}
            sx={{
              fontSize: scaleWidthToActual(70) + "px",
              border: drawBorder ? scaleWidthToActual(25) + "px solid black" : "",
            }}
          >
            {value}
          </FieldButton>
        )
      );
    }), 

    // Driver Skill
    createFieldLocalMatchComponent(
      "driverSkill",
      250,
      450,
      500,
      150,
      (match) => (
        <FieldButton
          color={COLORS.PRIMARY}
          sx={{
            fontSize: scaleWidthToActual(80) + "px",
          }}
        >
          Driver Skill
        </FieldButton>
      )
    ),

    // Driver Skill Options
    ...[100, 350, 600, 850, 1100, 1350, 1600].map((x, index) => {
      const value = ["N/A", 0, 1, 2, 3, 4, 5][index];
      const drawBorder = endgame.driverSkill===value;
      return createFieldLocalMatchComponent(
        `${index}DriverSkill`,
        x,
        600,
        200,
        100,
        (match) => (
          <FieldButton
            color={COLORS.PENDING}
            onClick={() => {setEndgame({...endgame, driverSkill: value});}}
            sx={{
              fontSize: scaleWidthToActual(70) + "px",
              border: drawBorder ? scaleWidthToActual(25) + "px solid black" : "",
            }}
          >
            {value}
          </FieldButton>
        )
      );
    }), 

    // Defense Skill
    createFieldLocalMatchComponent(
      "defenseSkill",
      250,
      800,
      500,
      150,
      (match) => (
        <FieldButton
          color={COLORS.PRIMARY}
          sx={{
            fontSize: scaleWidthToActual(80) + "px",
          }}
        >
          Defense Skill
        </FieldButton>
      )
    ),

    // Defense Skill Options
    ...[100, 350, 600, 850, 1100, 1350, 1600].map((x, index) => {
      const value = ["N/A", 0, 1, 2, 3, 4, 5][index];
      const drawBorder = endgame.defenseSkill===value;
      return createFieldLocalMatchComponent(
        `${index}DefenseSkill`,
        x,
        950,
        200,
        100,
        (match) => (
          <FieldButton
            color={COLORS.PENDING}
            onClick={() => {setEndgame({...endgame, defenseSkill: value});}}
            sx={{
              fontSize: scaleWidthToActual(70) + "px",
              border: drawBorder ? scaleWidthToActual(25) + "px solid black" : "",
            }}
          >
            {value}
          </FieldButton>
        )
      );
    }), 

    // Role
    createFieldLocalMatchComponent(
      "role",
      250,
      1150,
      500,
      150,
      (match) => (
        <FieldButton
          color={COLORS.PRIMARY}
          sx={{
            fontSize: scaleWidthToActual(80) + "px",
          }}
        >
          Role
        </FieldButton>
      )
    ),

    // Role Options
    ...[225, 685, 1145, 1605].map((x, index) => {
      const value = ["N/A", "Defense", "Coral Cycle", "Algae Cycle"][index];
      const drawBorder = endgame.role===value;
      return createFieldLocalMatchComponent(
        `${index}Role`,
        x,
        1300,
        450,
        100,
        (match) => (
          <FieldButton
            color={COLORS.PENDING}
            onClick={() => {setEndgame({...endgame, role: value});}}
            sx={{
              fontSize: scaleWidthToActual(70) + "px",
              border: drawBorder ? scaleWidthToActual(25) + "px solid black" : "",
            }}
          >
            {value}
          </FieldButton>
        )
      );
    }), 
    
    //comments
    createFieldLocalMatchComponent(
      "comments", 
      2250, 
      750, 
      750, 
      1400, 
      (match) => (
        <>
          <label 
            htmlFor="comments" 
            style={{
              color: "black",
              fontSize: scaleWidthToActual(100) + "px",
            }}
          >
            COMMENTS:
          </label>
          <textarea
            id="comments"
            onChange={(event) => setEndgame({...endgame, comments: event.target.value})}
            style={{
              width: '100%',
              height: '100%'
            }}
          >
          </textarea>
        </>
      )
    ),
  ]

  console.log(endgame);

  const renderFieldCanvas = () => {
    const fieldChildren = [
      ...[phase === PHASES.PREMATCH && PrematchChildren],
      ...[
        phase === PHASES.PREMATCH ||
        phase === PHASES.AUTO ||
        phase === PHASES.TELE
          ? AlgaeCoralIcons
          : [],
      ],
      ...[phase === PHASES.AUTO && AutoChildren],
      ...[
        phase === PHASES.AUTO || phase === PHASES.TELE ? AutoTeleChildren : [],
      ],
      ...[phase === PHASES.TELE ? TeleChildren : []],
      ...[phase === PHASES.POSTMATCH ? PostMatchChildren : []]
    ];

    return (
      <Box
        sx={{
          transform: `translateX(${isDefending ? -50 : 0}%)`,
        }}
      >
        {scaledBoxRect.width > 0 && (
          <FieldCanvas
            ref={fieldCanvasRef}
            theme={BlueTheme}
            fieldBoxRect={scaledBoxRect}
            children={fieldChildren}
            onClick={(x, y) => {
              if (!hasCoral()) {
                setCoral({
                  ...coral,
                  attainedLocation: [x, y],
                });
              } else {
                setCoral({
                  ...coral,
                  depositLocation: [x, y],
                });
              }

              if (!hasAlgae()) {
                setAlgae({
                  ...algae,
                  attainedLocation: [x, y],
                });
              } else {
                setAlgae({
                  ...algae,
                  depositLocation: [x, y],
                });
              }
            }}
            phase={phase}
          />
        )}
      </Box>
    );
  };

  const renderSideBar = () => {
    let buttonsList = [];

    if (phase === PHASES.PREMATCH) {
      buttonsList = [
        {
          id: 0,
          flexWeight: 2,
          component: (
            <Button
              variant="contained"
              color={startingPosition < 0 ? "disabled" : COLORS.ACTIVE}
              disabled={startingPosition < 0}
              onClick={() => {
                setMatchStartTime(Date.now());
                setPhase(PHASES.AUTO);
              }}
              sx={{
                width: "100%",
                height: "100%",
                fontSize: "1.5rem",
              }}
            >
              Start Match
            </Button>
          ),
        },
        {
          id: 1,
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={hasCoral() ? COLORS.SUCCESS : COLORS.PENDING}
              onClick={() => {
                setCoral(
                  hasCoral()
                    ? {}
                    : { attainedLocation: "preload", attainedTime: 0 }
                );
              }}
              sx={{
                width: "100%",
                height: "100%",
                fontSize: "1.5rem",
              }}
            >
              {hasCoral() ? "Preload Coral" : "No Preload"}
            </Button>
          ),
        },
      ];
    } else if (
      (phase === PHASES.AUTO || phase === PHASES.TELE) && 
      !isDefending && 
      hang.position==null) { //STANDARD AUTO/TELE
      let drawCancelButton = false;
      //REEF CORAL SCORE BUTTONS
      if (hasCoral() && coral.depositLocation?.includes("reef")) {
        drawCancelButton = true;
        [1, 2, 3, 4].map((level, index) => {
          buttonsList.push({
            id: index,
            flexWeight: 1,
            component: (
              <Button
                variant="contained"
                color={COLORS.CORALDROPOFF}
                onClick={() => {
                  updateCoral({
                    ...coral,
                    depositLocation: coral.depositLocation + `L${level}`,
                    depositTime: currentTime,
                  });
                  if (!hasAlgae()) {
                    updateAlgae({});
                  }
                }}
              >
                L{level}
              </Button>
            ),
          });
        });

        //drop coral button
        buttonsList.push({
          id: 4,
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={COLORS.CORALDROPOFF}
              onClick={() => {
                updateCoral({
                  ...coral,
                  depositLocation: "DROP",
                  depositTime: currentTime,
                });
                if (!hasAlgae()) {
                  updateAlgae({});
                }
              }}
            >
              DROP CORAL
            </Button>
          ),
        });
      }

      //REEF ALGAE PICKUP BUTTON
      if (!hasAlgae() && algae.attainedLocation?.includes("reef")) {
        drawCancelButton = true;
        buttonsList.push({
          id: 5,
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={COLORS.ALGAEPICKUP}
              onClick={() => {
                updateAlgae({
                  ...algae,
                  attainedTime: currentTime,
                });
                updateCoral({ ...coral, depositLocation: null });
              }}
            >
              PICKUP ALGAE
            </Button>
          ),
        });
      }

      //CORAL pickup from coral mark
      if (!hasCoral() && coral.attainedLocation?.includes("coralMark")) {
        drawCancelButton = true;
        buttonsList.push({
          id: 0,
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={COLORS.CORALPICKUP}
              onClick={() => {
                updateCoral({
                  ...coral,
                  attainedTime: currentTime,
                });
                if (!hasAlgae()) {
                  updateAlgae({});
                }
              }}
            >
              PICKUP CORAL
            </Button>
          ),
        });
      }

      //ALGAE pickup from coral mark
      if (!hasAlgae() && algae.attainedLocation?.includes("coralMark")) {
        drawCancelButton = true;
        buttonsList.push({
          id: 0,
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={COLORS.ALGAEPICKUP}
              onClick={() => {
                updateAlgae({ ...algae, attainedTime: currentTime });
                if (!hasCoral()) {
                  updateCoral({});
                }
              }}
            >
              PICKUP ALGAE
            </Button>
          ),
        });
      }

      //PROCESSOR/NET SCORE MENU
      if (
        algae.depositLocation === "processor" ||
        algae.depositLocation === "net"
      ) {
        drawCancelButton = true;
        buttonsList.push(
          {
            id: 0,
            flexWeight: 1,
            component: (
              <Button
                variant="contained"
                color={COLORS.ALGAEDROPOFF}
                onClick={() => {
                  updateAlgae({ ...algae, depositTime: currentTime });
                }}
              >
                SCORE {algae.depositLocation}
              </Button>
            ),
          },
          {
            id: 1,
            flexWeight: 1,
            component: (
              <Button
                variant="contained"
                color={COLORS.ALGAEDROPOFF}
                onClick={() => {updateAlgae({ 
                    ...algae, 
                    depositLocation: "DROP", 
                    depositTime: currentTime 
                  });
                }}
              >
                DROP {algae.depositLocation}
              </Button>
            ),
          }
        );
      }

      //coral station
      if (!hasCoral() && coral.attainedLocation?.includes("CoralStation")) {
        drawCancelButton = true;
        buttonsList.push(
          {
            id: 0,
            flexWeight: 1,
            component: (
              <Button
                variant="contained"
                color={COLORS.CORALPICKUP}
                onClick={() => {updateCoral({ ...coral, attainedTime: currentTime });}}
              >
                CORAL PICKUP
              </Button>
            ),
          },
          {
            id: 0,
            flexWeight: 1,
            component: (
              <Button
                variant="contained"
                color={COLORS.CORALDROPOFF}
                onClick={() => {updateCoral({ 
                    ...coral, 
                    attainedTime: currentTime, 
                    depositLocation: "DROP", 
                    depositTime: currentTime
                  });
                }}
              >
                DROP CORAL
              </Button>
            ),
          }
        );
      }

      //Coral ground pickup/dropoff
      if (
        (Array.isArray(coral.attainedLocation) && coral.attainedTime == null) ||
        (Array.isArray(coral.depositLocation) && coral.depositTime == null)
      ) {
        drawCancelButton = true;
        buttonsList.push({
          id: 0,
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={hasCoral() ? COLORS.CORALDROPOFF : COLORS.CORALPICKUP}
              onClick={() => {
                if (hasCoral()) {
                  setCoral({
                    ...coral,
                    depositTime: currentTime,
                  });
                } else {
                  setCoral({
                    ...coral,
                    attainedTime: currentTime,
                  });
                }

                if (algae.attainedTime == null) {
                  setAlgae({});
                } else if (algae.depositTime == null) {
                  setAlgae({
                    ...algae,
                    depositLocation: null,
                  });
                }
              }}
            >
              CORAL {hasCoral() ? "DROPOFF" : "PICKUP"}
            </Button>
          ),
        });
      }

      if (
        (Array.isArray(algae.attainedLocation) && algae.attainedTime == null) ||
        (Array.isArray(algae.depositLocation) && algae.depositTime == null)
      ) {
        drawCancelButton = true;
        buttonsList.push({
          id: 0,
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={hasAlgae() ? COLORS.CORALDROPOFF : COLORS.CORALPICKUP}
              onClick={() => {
                if (hasAlgae()) {
                  setAlgae({
                    ...algae,
                    depositTime: currentTime,
                  });
                } else {
                  setAlgae({
                    ...algae,
                    attainedTime: currentTime,
                  });
                }

                if (coral.attainedTime == null) {
                  setCoral({});
                } else if (coral.depositTime == null) {
                  setCoral({
                    ...coral,
                    depositLocation: null,
                  });
                }
              }}
            >
              ALGAE {hasAlgae() ? "DROPOFF" : "PICKUP"}
            </Button>
          ),
        });
      }

      //CANCEL button
      const cancel = () => {
        if (!hasCoral()) {
          setCoral({});
        } else if (coral.depositTime == null) {
          setCoral({
            ...coral,
            depositLocation: null,
          });
        }

        if (!hasAlgae()) {
          setAlgae({});
        } else if (coral.depositTime == null) {
          setAlgae({
            ...algae,
            depositLocation: null,
          });
        }
      };
      if (drawCancelButton) {
        buttonsList.push({
          id: 6,
          flexWeight: 1,
          component: (
            <Button variant="contained" color={COLORS.PENDING} onClick={cancel}>
              cancel
            </Button>
          ),
        });
      }
    } else if (phase==PHASES.AUTO || phase==PHASES.TELE && isDefending ){ // DEFENSE MENU
      if (defense.defendingTeam==null){
        enemies.map((enemy, index) => {
          buttonsList.push({
            id: index,
            flexWeight: 1,
            component: (
              <Button
                variant="contained"
                color={COLORS.PENDING}
                onClick={() => {
                  setDefense({
                    startTime: currentTime,
                    defendingTeam: enemy,
                    endTime: null,
                  });
                }}
              >
                {enemy}
              </Button>
            ),
          });
        });
      } else {
        buttonsList.push({
          id: 0,
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={COLORS.PENDING}
              onClick={() => {
                setDefense({ ...defense, endTime: currentTime });
              }}
            >
              STOP DEFENDING
            </Button>
          ),
        });
      }
    } else if (phase==PHASES.TELE && hang.position!=null){ //HANG MENU
      //depth options
      ["park", "shallow", "deep", "fail"].map((height, index) => {
        buttonsList.push({
          id: index,
          flexWeight: 1,
          component: (
            <Button
              color={COLORS.PENDING}
              variant="contained"
              onClick={() => {
                setHang({
                  ...hang,
                  time: currentTime,
                  height: height,
                });
              }}
            >
              {height}
            </Button>
          ),
        });
      });
      //CANCEL button
      buttonsList.push({
        id: 4,
        flexWeight: 1,
        component: (
          <Button
            variant="contained"
            color={COLORS.PENDING}
            onClick={() => {
              setHang({
                time: null,
                position: null,
                depth: null,
              });
            }}
          >
            CANCEL
          </Button>
        ),
      });
    }

    for (let i = 0; i < buttonsList.length; i++) {
      const button = buttonsList[i];

      buttonsList[i] = {
        ...button,
        component: React.cloneElement(button.component, {
          sx: {
            width: "90%",
            height: "90%",
            fontSize: scaleWidthToActual(100) + "px",
            borderRadius: scaleWidthToActual(150) + "px",
            ...button.component.sx,
          },
        }),
      };
    }

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: BlueTheme.palette.background.paper,
          overflowY: "auto",
        }}
      >
        {buttonsList.map((button, index) => (
          <Box
            key={index}
            sx={{
              flex: button.flexWeight || 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: 0,
            }}
          >
            {button.component}
          </Box>
        ))}
      </Box>
    );
  };

  const createFieldButton = ({ props }) => {};

  const getScaledBoxDimensions = () => {
    const { innerWidth, innerHeight } = window;
    let width = innerWidth;
    let height = width / aspectRatio;

    if (height > innerHeight) {
      height = innerHeight;
      width = height * aspectRatio;
    }

    return { width, height };
  };

  const resizeScaledBox = () => {
    const { width, height } = getScaledBoxDimensions();

    const rect = scaledBoxRef.current?.getBoundingClientRect() || {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };

    setScaledBoxRect({
      x: rect.left,
      y: rect.top,
      width,
      height,
    });
  };

  useEffect(() => {
    resizeScaledBox();
    window.addEventListener("resize", resizeScaledBox);
    return () => window.removeEventListener("resize", resizeScaledBox);
  }, []);

  return (
    <MatchContext.Provider value={CONTEXT_WRAPPER}>
      <ThemeProvider theme={BlueTheme}>
        <Box
          sx={{
            position: "relative",
            width: "100vw",
            height: "100vh",
          }}
        >
          <FullscreenDialog />
          <Box
            ref={scaledBoxRef}
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: scaledBoxRect.width,
              height: scaledBoxRect.height,
              transform: "translate(-50%, -50%)",
              background: BlueTheme.palette.background.default,
            }}
          >
            <Box
              sx={{
                position: "absolute",
                left: scaleWidthToActual(sidebarVirtualWidth),
                width:
                  scaledBoxRect.width - scaleWidthToActual(sidebarVirtualWidth),
                height: scaledBoxRect.height,
                overflow: "hidden",
              }}
            >
              {renderFieldCanvas()}
            </Box>
            <Box
              sx={{
                position: "absolute",
                left: 0,
                width: scaleWidthToActual(sidebarVirtualWidth),
                height: scaledBoxRect.height,
              }}
            >
              {renderSideBar()}
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    </MatchContext.Provider>
  );
};

export default ScoutMatch;
