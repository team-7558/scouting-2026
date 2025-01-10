import React, { useState, useRef, useEffect } from 'react';
import fieldBlueLeft from './fieldBlue.png';

function MatchScouting(){
  const canvasRef = useRef(null)

  //initialize state
  const [buttons, setButtons] = useState([]);
  const phases = {preMatch: 1, auto: 2, teleop: 3, endgame: 4, postMatch: 5}; 
  const [mouseDown, setMouseDown] = useState(false);
  const [phase, setPhase] = useState(phases.preMatch);
  const [preload, setPreload] = useState(null);
  const [startPosition, setStartPosition] = useState(null);
  const [xOpened, setXOpened] = useState(false);

  function resetState(){
    setButtons([]);
    setPhase(phases.preMatch);
    setPreload(null);
    setStartPosition(null);
    setXOpened(false);
  }

  function onScreenClicked(e){
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    buttons.forEach(button => {
      if (clickX >= button.posX && 
        clickX <= button.posX + button.width &&
        clickY >= button.posY && 
        clickY <= button.posY + button.height){
          try{
            button.onClick((clickX, clickY));
          }catch{
            button.onClick();
          }
        }
    });
  }

  function handleMouseMove(e){
    //checks if the mouse is down, scout is in pre-match, and click is on the slider area
    if (mouseDown && phase==phases.preMatch && e.clientX>=(window.innerWidth-15)*0.7 && e.clientX<=(window.innerWidth-15)*0.8){
      setStartPosition(e.clientY);
    }
  }

  //draws the entire canvas.
  function drawCanvas(canvasRef){
    //define general variables for the canvas and set size
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = window.innerWidth - 15;
    canvas.height = window.innerHeight;
    const width = window.innerWidth - 15;
    const height = window.innerHeight;

    context.clearRect(0, 0, width, height);

    function createButton(posX, posY, width, height, cornerRadius, color, onClick, text="", textSize=16, textColor="#000000"){
      context.beginPath();
      context.roundRect(posX, posY, width, height, cornerRadius);
      context.fillStyle = color;
      context.fill();

      context.fillStyle = textColor;
      context.font = `${textSize}px "Times New Roman"`;
      context.textAlign = "center";
      context.baseLine = "top";
      context.fillText(text, posX + width/2, posY+textSize/2+(height/2));

      let newButtons = buttons;
      newButtons.push({posX, posY, width, height, onClick});
      setButtons(newButtons);
    }

    function drawPreMatch(){
      //start match button
      function onStartMatchButtonClicked(){
        if(preload!=null && startPosition!=null){
          setPhase(phases.auto);
        }
      }
      if (preload!=null && startPosition!=null){
        createButton(width*0.02, height*0.05, width*0.25, height*0.5, 10, "#AAFFAA", onStartMatchButtonClicked, "START MATCH", 25, "#004400");
      }else{
        createButton(width*0.02, height*0.05, width*0.25, height*0.5, 10, "#CCCCCC", onStartMatchButtonClicked, "START MATCH", 25, "#888888");
      }
      //preload button
      function onPreloadButtonClicked(){
        if (preload==null){
          setPreload(true);
        }
        setPreload(!preload);
      }
      if (preload==null){
        createButton(width*0.02, height*0.6, width*0.25, height*0.3, 10, "#FF0000", onPreloadButtonClicked, "Preload?", 20);
      }else if (preload==false){
        createButton(width*0.02, height*0.6, width*0.25, height*0.3, 10, "#FFFF99", onPreloadButtonClicked, "NO PRELOAD", 20);
      }else if (preload==true){
        createButton(width*0.02, height*0.6, width*0.25, height*0.3, 10, "#99FF99", onPreloadButtonClicked, "PRELOAD CORAL", 20);
      }

      //startPosition slider. Logic to make it work is in handleMouseMovement above.
      if (startPosition==null){
        createButton(width*0.7, 0, width*0.1, height, 10, "rgba(255, 0, 0, 0.2)", () => {});
      }else{
        createButton(width*0.7, 0, width*0.1, height, 10, "rgba(0, 255, 0, 0.2)", () => {});
        createButton(width*0.65, startPosition-height*0.01, width*0.2, height*0.02, 10, "#00FF00", () => {});
      }

      //x button
      createButton(width*0.92, height*0.03, width*0.05, width*0.05, 5, "#BBBBBB", () => {setXOpened(true)}, "X", 40, "#FF0000");
      if (xOpened){
        //main background
        createButton(width*0.35, height*0.3, width*0.3, height*0.2, 15, "#BBBBBB", () => {});
        context.fillStyle = "#000000";
        context.font = `20px Times New Roman`;
        context.textAlign = "center";
        context.baseLine = "top";
        context.fillText("Are you sure you want to restart?", width*0.5, height*0.35);

        //yes button
        createButton(width*0.38, height*0.4, width*0.1, height*0.05, 5, "#AAFFAA", resetState, "Yes", 15, "#000000");
        //no button
        createButton(width*0.52, height*0.4, width*0.1, height*0.05, 5, "#FFAAAA", () => {setXOpened(false)}, "No", 15, "#000000");
      }
    }

    //draw the image of the field
    const fieldImage = new Image();
    fieldImage.src = fieldBlueLeft;
    fieldImage.onload = () => {
      context.drawImage(fieldImage, width*0.3, 0, width*0.7, height);
      
      if (phase==phases.preMatch){
        drawPreMatch();
      }
      if (phase==phases.auto){
        console.log("AUTO")
      }
    };
  }
  
  useEffect(() => {
    drawCanvas(canvasRef)
  }, [phase, preload, startPosition, xOpened]) //list all state variables I want to re-render when changed
  
  return <canvas ref={canvasRef} style={{margin: "15"}} 
    onClick={onScreenClicked} 
    onMouseMove={handleMouseMove}
    onMouseDown={() => {setMouseDown(true);}}
    onMouseUp={() => {setMouseDown(false);}}/>
}

export default MatchScouting;