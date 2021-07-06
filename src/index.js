import React from 'react';
import ReactDOM from 'react-dom';
import Body from './component/Body';
import Provider from './component/Providers'
import reportWebVitals from './reportWebVitals';

// 严格模式存在双重渲染问题，见 https://stackoverflow.com/questions/61254372/my-react-component-is-rendering-twice-because-of-strict-mode
const strict = false
const app = (
  <Provider>
    <Body />
  </Provider>
)

ReactDOM.render(strict ?
  <React.StrictMode>
    {app}
  </React.StrictMode> : app,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
