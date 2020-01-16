/*
사용자들을 팔로우할 수 있는 화면입니다.
유저가 팔로우 된 경우 팔로우한 유저라고알려줍니다.
팔로우 할 경우, 유저의 친구목록에 팔로우한 유저를 추가시켜줍니다.
 */
import React, {Component} from 'react'
import request from 'superagent'
import {Redirect} from 'react-router-dom'
import styles from './styles'
import {Button}from 'reactstrap';

export default class Users extends Component {
  constructor (props) {
    super(props)  //전체 유저목록과 페이지 이동에 쓰일 jump, 팔로우한 친구 목록을 초기화합니다.
    this.state = { users: [], jump: '', friends: [] }
  }
    //react가 DOM과 연결되기 전에 전체 유저목록과 유저의 친구목록을 서버에서 받아옵니다.
    componentWillMount () {
    this.loadUsers()
  }
  // 사용자 목록과 자신의 친구 정보를 얻습니다.
  loadUsers () {
    request
      .get('/api/get_allusers') //현재 사용자의 아이디를 서버에 보내고, 전체 유저 목록을 받습니다.
      .query({userid: window.localStorage.sns_id})
      .end((err, res) => {
        if (err) return     // 전체유저배열을 user변수에 지정해줍니다.
        this.setState({users: res.body.users})
      })
    request                     //현재 유저와 친구인 아이디 목록을 받아옵니다.
      .get('/api/get_user')
      .query({userid: window.localStorage.sns_id})
      .end((err, res) => {
        console.log(err, res)
        if (err) return     // 친구목록 배열을 friends배열 변수에 지정합니다.
        this.setState({friends: res.body.friends})
      })
  }
  // 친구 추가 버튼을 눌렀을 때
  addFriend (friendid) {
    request
      .get('/api/add_friend')
      .query({      // 현재 유저의 아이디와 친구 아이디를 서버에 보냅니다.
        userid: window.localStorage.sns_id,
        friendid: friendid
      })
      .end((err, res) => {
        if (err) return
        if (!res.body.status) {
          window.alert(res.body.msg)
          return
        }
        this.loadUsers()
      })
  }

    //react와 DOM을 연겷해 렌더링 합니다.
  render () {
      if (this.state.jump) {    //사용자가 다른 페이지로 이동하려는 경우, 해당 페이지로 이동시킵니다.
          return <Redirect to={this.state.jump}/>
      } //가져온 친구의 배열이 있는 지 없는지 확인
      const friends = this.state.friends ? this.state.friends : {}
      var UserList; // 렌더링 할 유저 목록 div 를 담을 변수.
      if (friends.length >= 1) {
          //만약 친구아이디 데이터가 있을 경우, 친구가 되어있다는 표시를 적용한 div를 userlist에 넣어줍니다.
          UserList = this.state.users.map(id => {            //전체 유저의 아이디와 친구 아이디를 대조해서
          const btn = (friends.find(function (element) {    //해당 유저가 현재 유저와 친구인 상태인지 불린 값을 알아냅니다.
              return element == id  //맞을 경우 true값 반환.
          }))
              ? <Button color="primary" style={{float:'right'}} onClick={eve => this.addFriend(id)}>
                  Following</Button>
              : (<Button outline color="primary" style={{float:'right'}} onClick={eve => this.addFriend(id)}>
                  Follow</Button>)

          return (
              <div style={styles.card}>
              <div key={'fid_' + id} >
                  <img src={'user.png'} style={styles.img}/><div style={{margin:'10px',fontSize:'20px'}}>{id}{btn}</div>

              </div>
          </div>)
      })
  }else {                   //해당 유저가 친구를 추가하지 않았을 경우,
          UserList = this.state.users.map(id => {
          return (
              <div style={styles.card}>
              <div key={'fid_' + id} >
                  <img src={'user.png'} style={styles.img}/>
                  <div style={{margin:'10px',fontSize:'20px'}}>{id}<Button outline color="primary" style={{float:'right'}} onClick={eve => this.addFriend(id)}>
                      Follow</Button></div>
                  <div style={{marginLeft:'10px'}}></div>
              </div>
          </div>)
          })
      }
    return (
      <div style={styles.back}>
        <div style={styles.userid}>사용자 목록</div>
         <div className= "col-md-8" style={{float:"left"}}>
        <div>{UserList}</div>
         </div>
        <div><br /><a href={'/timeline'}>→타임 라인보기</a></div>
      </div>
    )
  }
}
