import axios from "axios";
import "./App.css";

//data will be the string we send from our server
const apiCall = () => {
  axios.get("http://localhost:3001/api").then((data) => {
    //this console.log will be in our frontend console
    console.log(data);
  });
};

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>Test 1132</p>
        <button onClick={apiCall}>Request to server</button>
      </header>
    </div>
  );
}

export default App;
