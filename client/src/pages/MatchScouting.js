import React, { useState, useRef, useEffect } from 'react';
import fieldBlueLeft from './fieldBlue.png';

function MatchScouting(){
  const canvasRef = useRef(null)

  //initialize state
  const phases = {preMatch: 1, auto: 2, teleop: 3, endgame: 4, postMatch: 5}; 
  const [phase, setPhase] = useState(phases.preMatch);
  const buttons = []

  function onScreenClicked(e){
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    buttons.forEach(button => {
      if (clickX >= button.posX && 
        clickX <= button.posX + button.width &&
        clickY >= button.posY && 
        clickY <= button.posY + button.height){
          button.onClick();
        }
    });
  }

  //draws the entire canvas. All helper functions are within it
  function drawCanvas(canvasRef){
    //define general variables for the canvas and set size
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = window.innerWidth - 15;
    canvas.height = window.innerHeight;
    const width = window.innerWidth - 15;
    const height = window.innerHeight;

    function createButton(posX, posY, width, height, cornerRadius, color, onClick, text="", textSize=16, textColor="#000000",){
      context.beginPath();
      context.roundRect(posX, posY, width, height, cornerRadius);
      context.fillStyle = color;
      context.fill();

      context.fillStyle = textColor;
      context.font = textSize + "px Ariel";
      context.textAlign = "center";
      context.baseLine = "middle";
      context.fillText(text, posX + width/2, posY + height/2)

      buttons.push({posX, posY, width, height, onClick});
    }

    //draws the image of the field.
    function drawFieldImage(){
      //draw the image of the field
      const fieldImage = new Image();
      fieldImage.src = fieldBlueLeft;
      fieldImage.onload = () => {
        context.drawImage(fieldImage, width*0.3, 0, width*0.7, height);
      };
    }

    function drawPreMatch(){
      //draw the start match button
      function onStartMatchButtonClicked(){
        console.log("here");
      }
      createButton(width*0.02, height*0.05, width*0.25, height*0.5, 10, "#CCCCCC", onStartMatchButtonClicked, "START MATCH", 30, "#888888");
      
      //draw the preload button
      // createButton(width*0.02, height*0.6, width*0.25, height*0.3, 10, "onClick", "#FF0000", "Preload?", 30)
    }

    drawFieldImage();

    if (phase==phases.preMatch){
      drawPreMatch();
    }
  }
  
  useEffect(() => {
    drawCanvas(canvasRef)
  }, [])
  
  return <canvas ref={canvasRef} style={{margin: "15"}} onClick={onScreenClicked}/>
}

export default MatchScouting;