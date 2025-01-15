import React, { useState, useRef, useEffect } from 'react';
import fieldBlueLeft from './fieldBlue.png';
import coralIconImage from './coralIcon.png';
import algaeIconImage from './algaeIcon.png';

function MatchScouting(){
  const canvasRef = useRef(null)

  //initialize state
  //non-tracked state
  const [buttons, setButtons] = useState([]);
  const phases = {preMatch: 1, auto: 2, teleop: 3, endgame: 4, postMatch: 5}; 
  const [mouseDown, setMouseDown] = useState(false);
  const [phase, setPhase] = useState(phases.preMatch);
  const [xOpened, setXOpened] = useState(false);
  const [time, setTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [maxTime, setMaxTime] = useState(15);
  const [reefButtonClicked, setReefButtonClicked] = useState(null);
  const sideMenuOptions = {nothing: 0, reefWithCoral: 1, reefNoCoral: 2, intakeMenu: 3};
  const [sideMenuButtons, setSideMenuButtons] = useState(0);
  const [currentIntake, setCurrentIntake] = useState(null);
  const [hasCoral, setHasCoral] = useState(false);
  const [hasAlgae, setHasAlgae] = useState(false);

  //tracked state
  const [coralCycles, setCoralCycles] = useState([]); //pickupPos, pickupTime, scorePos, scoreTime
  const [algaeCycles, setAlgaeCycles] = useState([]); //pickupPos, pickupTime, scorePos, scoreTime
  const [preload, setPreload] = useState(null);
  const [startPosition, setStartPosition] = useState(null);
  const [leaveAuto, setLeaveAuto] = useState(false);

  function resetState(){
    setButtons([])
    setMouseDown(false);
    setPhase(phases.preMatch);
    setXOpened(false);
    setTime(0);
    setTimerRunning(false);
    setMaxTime(15);
    setReefButtonClicked(null);
    setSideMenuButtons(0);
    setHasCoral(false);
    setHasAlgae(false);

    //tracked state
    setCoralCycles([]); 
    setAlgaeCycles([]);
    setPreload(null);
    setStartPosition(null);
    setLeaveAuto(false);
  }

  function onScreenClicked(e){
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    console.log(clickX/window.innerWidth, clickY/window.innerHeight);
    
    let buttonClicked = false;
    buttons.forEach(button => {
      if (clickX >= button.posX && 
        clickX <= button.posX + button.width &&
        clickY >= button.posY && 
        clickY <= button.posY + button.height){
          button.onClick();
          buttonClicked = true;
        }
    });

    //when you click anywhere, bring up an intake menu
    if (!buttonClicked && !(hasAlgae && hasCoral)){
      setSideMenuButtons(sideMenuOptions.intakeMenu);
      const width = window.innerWidth - 15;
      setCurrentIntake([(clickX - (0.3*width)) / (width - (0.3*width)), clickY/(window.innerHeight-30)]);
      console.log(currentIntake);
    }
  }

  function handleMouseMove(e){
    //checks if the mouse is down, scout is in pre-match, and click is on the slider area
    if (mouseDown && phase==phases.preMatch && e.clientX>=(window.innerWidth-15)*0.7 && e.clientX<=(window.innerWidth-15)*0.8){
      setStartPosition(e.clientY);
    }
  }

  useEffect(() => {
    let timer;
  
    if (timerRunning) {
      timer = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime < maxTime) {
            const updatedTime = prevTime + 1;
            return updatedTime;
          } else {
            clearInterval(timer);
            setTimerRunning(false);
            return prevTime;
          }
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerRunning]);

  //draws the entire canvas.
  function drawCanvas(canvasRef){
    setButtons([]);

    //define general variables for the canvas and set size
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = window.innerWidth - 15;
    canvas.height = window.innerHeight - 30;
    const width = window.innerWidth - 15;
    const height = window.innerHeight - 30;

    context.clearRect(0, 0, width, height);

    function createButton(posX, posY, width, height, cornerRadius, color, onClick, text="", textSize=16, textColor="#000000", textHeight=0.5){
      context.beginPath();
      context.roundRect(posX, posY, width, height, cornerRadius);
      context.fillStyle = color;
      context.fill();

      context.fillStyle = textColor;
      context.font = `${textSize}px "Times New Roman"`;
      context.textAlign = "center";
      context.textBaseLine = "top";
      context.fillText(text, posX + width/2, posY + height*textHeight);

      setButtons(prevButtons => [...prevButtons, {posX, posY, width, height, onClick}]);
    }

    function createCircularButton(posX, posY, radius, color, onClick, borderWidth, borderColor){
      context.beginPath();
      context.arc(posX, posY, radius, 0, 2*Math.PI);
      context.fillStyle = color;
      context.fill();

      context.strokeStyle=borderColor;
      context.lineWidth=borderWidth;
      context.stroke();

      setButtons(prevButtons => [...prevButtons, {posX: posX-radius, posY: posY-radius, width: radius*2, height: radius*2, onClick: onClick}]);
    }

    function drawXButton(){
      createButton(width*0.92, height*0.03, width*0.05, width*0.05, 5, "#BBBBBB", () => {setXOpened(true)}, "X", 40, "#FF0000", 0.7);
      if (xOpened){
        //main background
        createButton(width*0.35, height*0.3, width*0.3, height*0.2, 15, "#BBBBBB", () => {}, "Are you sure you want to restart?", 15, "#000000", 0.3);
        //yes button
        createButton(width*0.38, height*0.4, width*0.1, height*0.05, 5, "#AAFFAA", resetState, "Yes", 15, "#000000", 0.7);
        //no button
        createButton(width*0.52, height*0.4, width*0.1, height*0.05, 5, "#FFAAAA", () => {setXOpened(false)}, "No", 15, "#000000", 0.7);
      }
    }

    function drawPreMatch(){
      //start match button
      function onStartMatchButtonClicked(){
        if(preload!=null && startPosition!=null){
          setPhase(phases.auto);
          setTimerRunning(true);
          if (preload){
            setHasCoral(true);
            setCoralCycles([{pickupPos: "preload", pickupTime: 0, scorePos: null, scoreTime: null}]);
          }
          setMaxTime(15);
        }
      }
      if (preload!=null && startPosition!=null){
        createButton(width*0.02, height*0.05, width*0.25, height*0.5, 10, "#AAFFAA", onStartMatchButtonClicked, "START MATCH", width*0.03, "#004400");
      }else{
        createButton(width*0.02, height*0.05, width*0.25, height*0.5, 10, "#CCCCCC", onStartMatchButtonClicked, "START MATCH", width*0.03, "#888888");
      }
      //preload button
      function onPreloadButtonClicked(){
        if (preload==null){
          setPreload(true);
        }
        setPreload(!preload);
      }
      if (preload==null){
        createButton(width*0.02, height*0.6, width*0.25, height*0.3, 10, "#FF0000", onPreloadButtonClicked, "Preload?", width*0.025);
      }else if (preload==false){
        createButton(width*0.02, height*0.6, width*0.25, height*0.3, 10, "#FFFF99", onPreloadButtonClicked, "NO PRELOAD", width*0.025);
      }else if (preload==true){
        createButton(width*0.02, height*0.6, width*0.25, height*0.3, 10, "#99FF99", onPreloadButtonClicked, "PRELOAD CORAL", width*0.025);
      }

      //startPosition slider. Logic to make it work is in handleMouseMovement above.
      if (startPosition==null){
        createButton(width*0.7, 0, width*0.1, height, 10, "rgba(255, 0, 0, 0.2)", () => {});
      }else{
        createButton(width*0.7, 0, width*0.1, height, 10, "rgba(0, 255, 0, 0.2)", () => {});
        createButton(width*0.65, startPosition-height*0.05, width*0.2, height*0.1, 10, "#00FF00", () => {});
      }

      drawXButton();
    }

    //circles around reef. starts at top left is 0, continues clockwise.
    function drawReefButtons(){
      function onReefButtonClicked(i){
        setReefButtonClicked(i);
        if (hasCoral){
          setSideMenuButtons(sideMenuOptions.reefWithCoral);
        }else{
          setSideMenuButtons(sideMenuOptions.reefNoCoral);
        }
      }
      const reefButtonPositions = [{x:0.54, y:0.38}, {x:0.61, y:0.38}, {x:0.65, y:0.5}, {x:0.61, y:0.62}, {x:0.54, y:0.62}, {x:0.5, y:0.5}];
      for (let i = 0; i < reefButtonPositions.length; i++) {
        const position = reefButtonPositions[i];
        if (reefButtonClicked==i){
          createCircularButton(width*position.x, height*position.y, width*0.02, "#FFFFFF", () => onReefButtonClicked(i), 5, "#000000");
        }else{
          createCircularButton(width*position.x, height*position.y, width*0.02, "#FFFFFF", () => onReefButtonClicked(i), 2, "#000000");
        }
      };
    }

    //buttons at the coral stations. labeled left/right from driver's POV
    function drawCoralStationButtons(){
      function onCoralStationButtonClicked(side){
        setCoralCycles(prevCoralCycles => [...prevCoralCycles, {pickupPos: side + "CoralStation", pickupTime: time, scorePos: null, scoreTime: null}]);
        setHasCoral(true);
      }
      if (!hasCoral){
        createButton(width*0.3, height*0.01, width*0.15, height*0.15, 10, "#FFFFFF", () => onCoralStationButtonClicked("left"), "Left HP Station", width*0.02, "#000000");
        createButton(width*0.3, height*0.85, width*0.15, height*0.15, 10, "#FFFFFF", () => onCoralStationButtonClicked("right"), "Right HP Station", width*0.02, "#000000");
      }
    }

    //coral and algae icons.
    function drawCoralAlgaeIcons(){
      if (hasCoral){
        const coralIcon = new Image();
        coralIcon.src = coralIconImage;
        coralIcon.onload = () => {
          context.drawImage(coralIcon, width*0.9, height*0.15, width*0.1, height*0.1);
        }
      }
      if (hasAlgae){
        const algaeIcon = new Image();
        algaeIcon.src = algaeIconImage;
        algaeIcon.onload = () => {
          context.drawImage(algaeIcon, width*0.9, height*0.3, width*0.1, width*0.1);
        }
      }
    }

    function drawProcessorNetButtons(){
      if (hasAlgae){
        createButton(width*0.6, height*0.9, width*0.2, height*0.1, 10, "#FFFFFF", () => {}, "Score Processor", width*0.03, "#000000");
        createButton(width*0.75, height*0.05, width*0.1, height*0.4, 10, "#FFFFFF", () => {}, "Net", width*0.03, "#000000");
      }
    }

    function drawAuto(){
      //display timer
      createButton(width*0.85, height*0.03, width*0.05, height*0.1, 0, "rgba(0, 0, 0, 0)", () => {}, time, width*0.05, "#FFFFFF", 1)

      drawReefButtons();

      drawCoralStationButtons();

      drawProcessorNetButtons();

      //TODO: add algae icon
      drawCoralAlgaeIcons();

      //buttons for the algae + coral already on the field. 0 is driver's left
      function onCoralMarkButtonPressed(num){
        setCurrentIntake("Coral Mark " + num);
        setSideMenuButtons(sideMenuOptions.intakeMenu);
      }
      createCircularButton(width*0.4, height*0.28, width*0.01, "#FFFFFF", () => onCoralMarkButtonPressed(0));
      createCircularButton(width*0.4, height*0.5, width*0.01, "#FFFFFF", () => onCoralMarkButtonPressed(1));
      createCircularButton(width*0.4, height*0.73, width*0.01, "#FFFFFF", () => onCoralMarkButtonPressed(2));

      //side menu
      if (sideMenuButtons==sideMenuOptions.nothing){ //leave button
        //leave? button
        function onLeaveButtonClicked(){
          setLeaveAuto(!leaveAuto);
        }
        if (leaveAuto){
          createButton(width*0.02, height*0.05, width*0.25, height*0.2, 10, "#AAFFAA", onLeaveButtonClicked, "LEFT", width*0.03, "#000000");
        } else{
          createButton(width*0.02, height*0.05, width*0.25, height*0.2, 10, "#FFAAAA", onLeaveButtonClicked, "DIDN'T LEAVE", width*0.03, "#000000");
        }
      }else if (sideMenuButtons==sideMenuOptions.reefWithCoral){ //L1-4, drop, descore algae, cancel. TODO: implement descore algae button
        //descore algae
        function onDescoredAlgaeClicked(){

        }
        createButton(width*0.02, height*0.05, width*0.25, height*0.1, 10, "#FFFFFF", onDescoredAlgaeClicked, "Descored Algae", width*0.02, "#000000", 0.65);

        //score coral buttons
        function onScoreCoralClicked(level){
          const coralCyclesCopy = JSON.parse(JSON.stringify(coralCycles));
          coralCyclesCopy[coralCyclesCopy.length-1]["scorePos"] = reefButtonClicked.toString() + level.toString();
          coralCyclesCopy[coralCyclesCopy.length-1]["scoreTime"] = time;
          setCoralCycles(coralCyclesCopy);
          setSideMenuButtons(sideMenuOptions.nothing);
          setHasCoral(false);
          setReefButtonClicked(null);
        }
        createButton(width*0.02, height*0.17, width*0.25, height*0.1, 10, "#FFFFFF", () => onScoreCoralClicked(4), "L4", width*0.02, "#000000", 0.65);
        createButton(width*0.02, height*0.29, width*0.25, height*0.1, 10, "#FFFFFF", () => onScoreCoralClicked(3), "L3", width*0.02, "#000000", 0.65);
        createButton(width*0.02, height*0.41, width*0.25, height*0.1, 10, "#FFFFFF", () => onScoreCoralClicked(2), "L2", width*0.02, "#000000", 0.65);
        createButton(width*0.02, height*0.53, width*0.25, height*0.1, 10, "#FFFFFF", () => onScoreCoralClicked(1), "L1", width*0.02, "#000000", 0.65);
        createButton(width*0.02, height*0.65, width*0.25, height*0.1, 10, "#FFFFFF", () => onScoreCoralClicked(0), "DROP", width*0.02, "#000000", 0.65);

        //cancel button
        createButton(width*0.02, height*0.77, width*0.25, height*0.1, 10, "#FFFFFF", () => {setSideMenuButtons(sideMenuOptions.nothing); setReefButtonClicked(null);}, "CANCEL", width*0.02, "#000000", 0.65);

      }else if (sideMenuButtons==sideMenuOptions.reefNoCoral){//descore algae, cancel.  TODO: implement descore algae button
        createButton(width*0.02, height*0.05, width*0.25, height*0.4, 10, "#FFFFFF", () => {}, "Descored Algae", width*0.03, "#000000", 0.5);
        createButton(width*0.02, height*0.5, width*0.25, height*0.4, 10, "#FFFFFF", () => {}, "CANCEL", width*0.03, "#000000", 0.5);
      }else if (sideMenuButtons==sideMenuOptions.intakeMenu){ //pickup algae, pickup coral, coral + algae. TODO: implement pickup algae and pickup both options
        createButton(width*0.02, height*0.05, width*0.25, height*0.2, 10, "#FFFFFF", () => {}, "Pickup Algae", width*0.03, "#000000");

        function onPickupCoralButtonClicked(){
          const coralCyclesCopy = JSON.parse(JSON.stringify(coralCycles));
          coralCyclesCopy.push({pickupPos: currentIntake, pickupTime: time, scorePos: null, scoreTime: null});
          setCoralCycles(coralCyclesCopy);
          setSideMenuButtons(sideMenuOptions.nothing);
          setHasCoral(true);
          console.log(coralCycles);
          setCurrentIntake(null);
        }
        if (hasCoral){
          createButton(width*0.02, height*0.3, width*0.25, height*0.2, 10, "#FFFFFF", () => {}, "Already Has Coral", width*0.03, "#AAAAAA");
          
        }else{
          createButton(width*0.02, height*0.3, width*0.25, height*0.2, 10, "#FFFFFF", onPickupCoralButtonClicked, "Pickup Coral", width*0.03, "#000000");
        }
        if (!hasCoral && !hasAlgae){
          createButton(width*0.02, height*0.55, width*0.25, height*0.2, 10, "#FFFFFF", () => {}, "Coral + Algae", width*0.03, "#000000");
        }

        //cancel
        createButton(width*0.02, height*0.77, width*0.25, height*0.1, 10, "#FFFFFF", () => {setSideMenuButtons(sideMenuOptions.nothing);}, "CANCEL", width*0.03, "#000000", 0.65);
      }

      drawXButton();
    }

    //draw the image of the field, and when it is loaded, draw everything else
    const fieldImage = new Image();
    fieldImage.src = fieldBlueLeft;
    fieldImage.onload = () => {
      context.drawImage(fieldImage, width*0.3, 0, width*0.7, height);
      
      if (phase==phases.preMatch){
        drawPreMatch();
      }
      if (phase==phases.auto){
        drawAuto();
      }
      console.log(coralCycles);
    };
  }
  
  useEffect(() => {
    drawCanvas(canvasRef)
  }, [phase, preload, startPosition, xOpened, time, reefButtonClicked, leaveAuto, sideMenuButtons, hasCoral, hasAlgae]) //list all state variables I want to re-render when changed
  
  return <canvas ref={canvasRef} style={{margin: "15"}} 
    onClick={onScreenClicked} 
    onMouseMove={handleMouseMove}
    onMouseDown={() => {setMouseDown(true);}}
    onMouseUp={() => {setMouseDown(false);}}/>
}

export default MatchScouting;