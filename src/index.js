/*
메인입니다.
sns에 필요한 로그인, 타임라인, 친구추가 등 js를 해당 index.js에 추가시켜서
사용자가 원하는 페이지로 이동시킬 수 있습니다.
 */
//리액트 모듈을 추가합니다.
import React from 'react';
//리액트로 html화면을 그려줄 수 있도록 리액트 돔을 추가합니다.
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
//리액트라우터를 추가합니다.
import {
  BrowserRouter as Router, //대부분의 웹앱들에서 동작할 수 있도록 BrowserRounter를 넣어줍니다.
  Route, //라우트는 원하는 페이지로 이동하게 보이게끔 특정 컴포넌트를 렌더링합니다. ex) <Route path="/login" component={ Logins } />
  Switch, //컴포넌트가 중복되지 않도록, 사용합니다. ex) path="/login/:name", path="/login" 맨 앞에 있는 name의 path부터 검사.
} from 'react-router-dom';
//경로를 추가합니다.
//users     친구추가 화면
//timeline  타임라인
//login     로그인
//navigation 홈페이지 윗 네비게이션바

import Users from './users';
import Timeline from './timeline';
import Login from './login';
import Showobj from './showobj';
import Navigation from './components/navigation';
const App = () => (
  <div>
    <Navigation />
    <Router>
      <div>
        <Switch>
          <Route path="/users" component={Users} />
          <Route path="/timeline" component={Timeline} />
          <Route path="/login" component={Login} />
          <Route path="/showobj" component={Showobj} />
          <Route component={Login} />
        </Switch>
      </div>
    </Router>
  </div>
);

// 위에서 설정한 div와 라우터 값들을 리액트와 DOV을 연결해 렌더링한다.
ReactDOM.render(<App />, document.getElementById('root'));
