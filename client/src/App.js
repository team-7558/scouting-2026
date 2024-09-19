import axios from "axios";
import "./App.css";
const SERVER_URL =
  process.env.NODE_ENV == "development" ? "http://localhost:3001/api" : "/api";

//data will be the string we send from our server
const apiCall = () => {
  axios.get(SERVER_URL).then((data) => {
    //this console.log will be in our frontend console
    console.log(data);
  });
};

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <button onClick={apiCall}>Request to server</button>
      </header>
    </div>
  );
}

export default App;
