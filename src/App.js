import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Scene from './Components/Scene/scene';

class App extends Component {
  render() {
    return (
      <div style={{width: '100%', height: '100%', position: 'absolute', overflow: 'hidden', background: 'linear-gradient(#00c4ff, #e5bc5f)'}}>
        <Scene />
      </div>
    );
  }
}

export default App;
