/*
로그인 할 수 있는 js입니다.
저장된 db에서 사용자의 정보를 가져와, 로그인, 회원가입을 할 수 있도록 도와줍니다.
 */
//리액트 컴포넌트 모듈을 추가합니다.
import React, {Component} from 'react'
import { Button, Input, Label, Form, FormGroup,Col }from 'reactstrap';
import request from 'superagent'
import {Redirect} from 'react-router-dom'
import styles from './styles'

// 로그인을 정의한 구성 요소
export default class Login extends Component {
  constructor (props) {
    super(props)        //유저 아이디와 비번, 이동할 컴포넌트, 메세지를 남긴다.
    this.state = { userid: '', passwd: '', jump: '', msg: '' }
  }
  // 로그인과 회원가입을 할 때, 해당 유저의 아이디와 비밀번호를 서버에 보냅니다.
  api (command) {
    request
      .post('/api/' + command)
      .type('form')
      .send({
        userid: this.state.userid,
        passwd: this.state.passwd
      })
      .end((err, res) => {
        if (err) return
        const r = res.body
        console.log(r)
        if (r.status ) {    //로그인과 회원가입 중 성공하게되면 타임라인 페이지로 이동됩니다.
          window.localStorage['sns_id'] = this.state.userid
          this.setState({jump: '/timeline'})
          return
        }                   //로그인과 회원가입을 실패하면 오류 메세지를 유저에게 보여줍니다.
        this.setState({msg: r.msg})
      })
  }
  render () {   // 위에서 지정한 jump값을 react가 인식하면, 해당 서버로 이동합니다.
    if (this.state.jump) {
      return <Redirect to={this.state.jump} />
    }   //아이디와 비밀번호를 적었을 경우,        아이디와 비밀번호의 state를 지정하는 변수입니다.
    const changed = (name, e) => this.setState({[name]: e.target.value}) //ex)  changed('userid', e) => [userid]: 1234
    return (
      <div>
        <div className="topbar js-topbar">
        <h2>로그인</h2>
        </div>
        <div className="container">
          <Col md={3}>
              <Label>사용자 ID</Label><br />
              <Input value={this.state.userid}
                onChange={e => changed('userid', e)} /><br />
          </Col>
          <Col md={3}>
            <FormGroup >
              <Label>비밀번호</Label><br />
              <Input type='password' value={this.state.passwd}
                onChange={e => changed('passwd', e)} /><br />
            </FormGroup>
          </Col>
            <Col md={3}>
          <Button outline color="primary" onClick={e => this.api('login')}>로그인</Button><br />
          <p style={styles.error}>{this.state.msg}</p>
          <p><Button outline color="primary" onClick={e => this.api('adduser')}>
              사용자 등록 (최초)</Button></p>
            </Col>
        </div>
      </div>
    )
  }
}
