/*
타임라인 화면입니다.
현재 유저의 유저가 팔로우한 사용자의 타임라인을 가져와 보여줍니다.
또한 사용자가 타임라인에 글을 쓸 경우, 타임라인 목록에 추가시켜 보여줍니다.
사용자가 팔로우한 사람의 수와, 작성한 글 갯수도 보여줍니다.
 */
// 리액트 모듈 추가
import React, { Component } from 'react';
//서버와 통신할 수 있는 superagent 모듈 추가
import Showobj from './showobj';
import request from 'superagent';
//스타일 css 파일 추가
import styles from './styles';
//리액트 부트스트랩4 모듈 추가
import {
  Col,
  Table,
  Input,
  Button,
  Form,
  FormGroup,
  ControlLabel,
  FormControl,
  Label,
} from 'reactstrap';
// 타임 라인 화면을 정의하는 컴포넌트
export default class Timeline extends Component {
  constructor(props) {
    super(props);
    // state 정보를 초기화합니다.
    //타임라인 목록(timelines)과 작성한 내용(comment)을 비웁니다.
    this.state = {
      timelines: [],
      comment: '',
      follow: '',
      write: '',
      now: '',
      recomment: [],
    };
    this.number = 0;
  }
  //react가 DOM과 연결되기 전에 실행되는 componentWillMount싸이클입니다.
  componentWillMount() {
    this.loadTimelines(); //타임라인 목록을 불러오는 메서드를 실행시킵니다.
  }
  loadTimelines() {
    // 타임 라인을 가져온다
    request //서버에 친구들 타임라인 API로 요청합니다.
      .get('/api/get_friends_timeline')
      .query({
        //해당 유저의 아이디를 서버에 보냅니다.
        userid: window.localStorage.sns_id,
      })
      .end((err, res) => {
        if (err) return;
        this.now = new Date().getTime();
        //state에 타임라인데이터를 가져와 타임라인 값이 바뀐걸 알려줍니다.
        //리액트가 브라우저에 바뀐 값을 렌더링 합니다.
        this.setState({
          timelines: res.body.timelines,
          follow: res.body.follow,
          write: res.body.write,
        });
      });
  }
  // 사용자가 글을 작성 후, 등록을 누를 때 동작하는 메소드입니다.
  post() {
    //오브젝트 파일과 mtl 파일이 있는지 로그로 표시.
    console.log(this.objFileInput);
    console.log(this.mtlFileInput);

    //오브젝트 파일을 사용자가 올렸는 지 확인할 boolean 값
    var filetf;

    //사용자가 오브젝트를 올렸으면, filetf를 true로 지정합니다.
    if (this.objFileInput) filetf = true;
    else filetf = false; //안 올렸을 경우 filetf는 false
    //해당 유저가 적은 글을 디비에 저장할 수 있도록 서버에 요청합니다.
    request
      .get('/api/add_timeline')
      .query({
        //유저의 아이디와 작성한 내용을 서버에 보낸다.
        userid: window.localStorage.sns_id, //유저아이디
        comment: this.state.comment, //글내용
        filetf: filetf, //오브젝트 파일 유무
      })
      .end((err, res) => {
        //서버의 응답을 받아옵니다.
        console.log(res.body.status);
        if (err) {
          //에러가 났을 경우 로그로 표시
          console.log(err);
          return;
        }
        //사용자가 올린 오브젝트를 서버에 보내주는 역할입니다.
        if (res.body.status === true) {
          //디비에 글 내용이 잘 저장되었고,
          console.log(res.msg); //사용자가 오브젝트를 올렸다면, 해당 obj와 mtl의 파일을 서버에 저장한다.
          console.log('obj도 올리자');
          request
            .post('/api/add_timeline')
            .field('timelineid', res.body.timelineid) //해당 오브젝트들의 이름을 디비에 수정하기 위해,
            .attach('objFile', this.objFileInput) //현재 유저의 글 id값을 서버에 보냅니다.
            .attach('mtlFile', this.mtlFileInput)
            .end((err, res) => {
              //완료되면 작성한 내용을 초기화 시키고, 다시 타임라인 목록을 불러온다.
              this.setState({ comment: '' });
              this.loadTimelines();
              this.obj.value = null;
              this.mtl.value = null;
            });
        } else {
          //사용자가 오브젝트를 안올렸을 경우,
          console.log('obj이 없다');
          this.setState({ comment: '' }); //글 내용만 디비에 저장한 뒤 다시 타임라인을 불러옵니다.
          this.loadTimelines();
        }
      });
  }

  repost(timelineid, id) {
    console.log(id);
    console.log(this.state.recomment[id]);

    request
      .get('/api/add_recomment')
      .query({
        //유저의 아이디와 작성한 내용을 서버에 보낸다.
        userid: window.localStorage.sns_id, //유저아이디
        timelineid: timelineid,
        recomment: this.state.recomment[id], //글내용
      })
      .end((err, res) => {
        //서버의 응답을 받아옵니다.
        console.log(res);
        if (res.status) {
          this.state.recomment[id] = '';
          this.setState({ recomment: [] });
          console.log(this.state.recomment[id]);
          this.loadTimelines();
        }
      });
  }
  // 사용자가 올린 오브젝트 파일을 this.objFileInput 변수에 넣어줍니다. 나중에 서버에 파일을 보낼 때
  getObjFile(e) {
    //해당 변수를 보냅니다.
    console.log(e.target.files);
    console.log(e.target.files[0]);
    this.objFileInput = e.target.files[0];
    console.log(this.objFileInput.name);
  }
  // 사용자가 올린 mtl 파일을 this.objFileInput 변수에 넣어줍니다.
  getMtlFile(e) {
    console.log(e.target.files[0]);
    this.mtlFileInput = e.target.files[0];
  }

  //react와 DOM을 연결해 렌더링 합니다.
  render() {
    // 가져온 타임라인글의 경과 시간을 구한다.
    const gettime = e => {
      var getTimelineTime = e; //타임라인 글의 시간을 가져온다.
      var secGap = Math.floor((this.now - getTimelineTime) / 1000); //초를 구한다.
      if (secGap < 1) {
        secGap = '1';
      } //초가 1초보다 작으면 1로 지정
      var minGap = Math.floor((this.now - getTimelineTime) / 1000 / 60); //분을 구한다.
      var houGap = Math.floor((this.now - getTimelineTime) / 1000 / 60 / 60); //시간을 구한다.
      var sendTime; //구한 타임라인 경과시간을 담을 변수.
      if (houGap < 0.9) {
        if (minGap < 0.9) {
          sendTime = secGap + '초';
        } else sendTime = minGap + '분';
      } else {
        sendTime = houGap + '시간';
      }
      return sendTime; //계산한 경과시간을 렌더링에 보낸다.
    };

    // three.js로 오브젝트 모델을 가져오는 함수
    //사용자가 보여주고 싶은 obj가 있을 때 화면에 보여주는 함수입니다.
    const getObjModel = (eobj, emtl) => {
      //showobj에 props 기본 값을 보낸 뒤 결과값을 받아온다
      if (eobj) {
        //사용자가 obj를 등록했을 때, 해당 obj가 등록된 경로를 showobj.js에 보낸다.
        const objpath = eobj;
        const mtlpath = emtl;
        //받아온 three모델 렌더링 화면을 메인 렌더링에 보내준다.
        return <Showobj obj={objpath} mtl={mtlpath} />;
      } else return null; //obj경로가 없을 경우 null값을 반환한다.
    };
    var isEmpty = value => {
      if (
        value == '' ||
        value == null ||
        value == undefined ||
        (value != null &&
          typeof value == 'object' &&
          !Object.keys(value).length)
      ) {
        return true;
      } else {
        return false;
      }
    };

    //타임라인에 달린 댓글을 불러온다.
    const recommentList = e => {
      var addcomment = []; // 사용자들의 댓글수만큼 div를 담을 변수
      if (!isEmpty(e)) {
        //댓글의 데이터가 있을 때,
        e.map(d => {
          //댓글 수 만큼 map을 돌린다.
          addcomment.push(
            <div style={{ margin: '10px' }}>
              <div style={{ float: 'left', margin: '5px' }}>
                {/* 사용자의 프로필 사진을 넣어줍니다. */}
                <img src={'user.png'} width="40" height="40" />
              </div>
              <div style={{ float: 'left', margin: '5px' }}>{d.userid}</div>
              <div style={{ float: 'left', margin: '5px' }}>{d.comment}</div>
            </div>
          );
        });
      } else if (isEmpty(e)) {
        return null;
      }
      return addcomment; //배열 변수를 보내준다.
    };
    //사용자들의 타임라인내용을 div에 담아서 만들어줍니다.
    //e.time    타임라인 등록된 시간
    //e.comment 타임라인 내용
    //e.objpath,mtlpath 오브젝트 경로
    //e.recomment 댓글 내용
    const timelines = this.state.timelines.map((e, index) => {
      this.number++;
      const redat = e.recomment ? e.recomment : {};
      return (
        <div className="card" key={index}>
          <div className="box">
            <div className="img">
              <img src={'user.png'} /> {/* 유저의 이미지가 들어갈 곳 */}
            </div>
            {/* 유저의 아이디와 경과 시간 */}
            <h2>
              {e.userid}
              <br />
              <span>{gettime(e.time)}</span>
            </h2>
          </div>
          <div className="under">
            {/* 사용자의 글 내용 */}
            <span style={{ float: 'bottom' }}>{e.comment}</span>
          </div>
          <div>
            {' '}
            {/* 오브젝트를 가져오는 함수 */}
            {getObjModel(e.objpath, e.mtlpath)}
          </div>
          {/*타임라인의 댓글을 적는 창이다*/}
          <div style={{ margin: '2%' }}>
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="댓글을 입력하세요"
                aria-label="Recipient's username"
                aria-describedby="basic-addon2"
                value={this.state.recomment[this.number]}
                onChange={e =>
                  (this.state.recomment[this.number] = e.target.value)
                }
              />
              <div className="input-group-append">
                {' '}
                {/* 사용자가 글 업로드 버튼을 누르면 서버에 데이터를 보내는 함수를 실행합니다. */}
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={evenet => this.repost(e._id + '', this.number)}>
                  작성
                </button>
              </div>
            </div>
          </div>

          {recommentList(redat)}
          <br style={{ margin: '10px' }} />
        </div>
      );
    });

    // 메인 렌더링입니다.
    //현재 사용자의 프로필과 전체 사용자의 타임라인을 보여줄 예정입니다.
    return (
      <div style={styles.back}>
        {/* 왼쪽 화면에 사용자의 프로필 화면을 그려줍니다. */}
        <div className="col-md-3 clearfix" style={styles.sidenar}>
          <div style={{ float: 'left' }}>
            {/* 사용자의 프로필 사진을 넣어줍니다. */}
            <img src={'user.png'} width="40" height="40" />
          </div>
          <div style={{ float: 'left' }}>
            {/* 사용자의 아이디를 넣어줍니다. */}
            <h1 style={styles.userid}>{window.localStorage.sns_id}</h1>
          </div>
          <br />
          <br />
          {/* 사용자의 글 작성수와 팔로우 수를 테이블로 그려줍니다. */}
          <Table borderless size="sm">
            <tbody>
              <tr>
                <td>Write</td>
                <td>Following</td>
              </tr>
              <tr>
                <td>{this.state.write}</td>
                <td>{this.state.follow}</td>
              </tr>
            </tbody>
          </Table>
        </div>

        {/* 사용자들의 타임라인을 볼 수 있도록 중앙에 지정합니다. */}
        <div className="col-md-6" style={{ float: 'left' }}>
          {/* 현재 사용자가 타임라인을 작성할 수 있도록 하는 글작성 div입니다.*/}
          <div style={{ backgroundColor: '#fff' }}>
            {/* obj파일과 mtl 파일을 올릴 수 있도록 테이블로 만듭니다. */}
            <table className="table table-borderless  table-sm">
              <tbody>
                <tr style={{ textAlign: 'center' }}>
                  <td>
                    <Label htmlFor="objload">obj 파일</Label>
                  </td>
                  <td>
                    <Label htmlFor="mtlload">mtl 파일</Label>
                  </td>
                </tr>
                <tr>
                  {' '}
                  {/* input으로 파일을 넣을 수 있도록 만듭니다. 파일을 가져왔을경우, onChange를 통해 파일을 변수에 넣습니다. */}
                  <td>
                    <Input
                      ref={obj => {
                        this.obj = obj;
                      }}
                      style={{ float: 'center' }}
                      id="uploadFile"
                      accept=".obj"
                      type="file"
                      onChange={e => this.getObjFile(e)}
                    />
                  </td>
                  <td>
                    <Input
                      ref={mtl => {
                        this.mtl = mtl;
                      }}
                      style={{ float: 'center' }}
                      id="uploadFile"
                      accept=".mtl"
                      type="file"
                      onChange={e => this.getMtlFile(e)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            {/* 사용자가 타임라인 내용을 작성한 뒤, 글을 업로들 할 수 있는 버튼을 만드는 div 입니다.
              this.state.comment로 input의 내용을 넣어줍니다. 사용자가 글을 작성할 때마다 해당 변수 값을 바뀌줍니다.*/}
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="어떤 장난감이 재밌었나요?"
                aria-label="Recipient's username"
                aria-describedby="basic-addon2"
                value={this.state.comment}
                onChange={e => this.setState({ comment: e.target.value })}
              />
              <div className="input-group-append">
                {' '}
                {/* 사용자가 글 업로드 버튼을 누르면 서버에 데이터를 보내는 함수를 실행합니다. */}
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={e => this.post()}>
                  작성
                </button>
              </div>
            </div>
          </div>
          {/* 팔로우한 유저와 해당 유저의 타임라인 글을 불러옵니다. */}
          <div>{timelines}</div>
          <hr />
          <p>
            <a href={'/users'}>→친구 추가</a>
          </p>
          <p>
            <a href={'/login'}>→다른 사용자로 로그인</a>
          </p>
        </div>
      </div>
    );
  }
}
