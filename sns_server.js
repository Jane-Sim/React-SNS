/*
노드 메인 서버입니다.
클라이언트가 원하는 정보(로그인, 친구 타임라인글, 친구목록 등)를 제공해주며,
sns 홈페이지에 필요한 데이터를 다룹니다.

 */
// 데이터베이스에 접속
const mongoose = require('mongoose');
mongoose
  .connect(
    'mongodb://UserID:UserPW@localhost:27017/admin?connectTimeoutMS=300000&authSource=admin',
    {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useFindAndModify: false,
      serverSelectionTimeoutMS: 5000,
    }
  )
  .catch(err => console.log(err.reason));
// 해당 서버의 경로를 알려주는 path 모듈
const path = require('path');
//클라이언트에서 받은 obj파일 쉽게 업로드 해주는 모듈.
const multer = require('multer');
//multer로 obj파일을 uploads에 저장한다.
const upload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, 'public/models/');
    }, //파일 이름을 커스텀해 저장할 수 있다.
    filename: function(req, file, cb) {
      cb(null, new Date().valueOf() + file.originalname); //파일 이름이 중복되지 않도록 시간을 넣는다.
    },
  }),
});
//요청 바디를 파싱하여서 req.body 객체로 접근할 수 있게 해줍니다. 세션이나 쿼리 값을 주고받을 수 있도록 사용.
const bodyParser = require('body-parser');

// express 모듈을 추가해서 서버를 가동합니다.
const express = require('express');
const app = express();

//포트번호
const portNo = 8444;

//몽구스의 스케마모듈을 추가시킵니다.
//User는 사용자 정보 디비
//Timeline은 사용자들의 타임라인
const { User, Timeline } = require('./models/dbschema');

//바디파서를 사용해서 사용자가 들어오는 url에서 쿼리를  분석합니다. 분석한 쿼리는 배열로 사용 가능해집니다.
app.use(
  bodyParser.urlencoded({
    extended: true, //확장을 허락함으로, 쿼리 문자열에서 중첩 된 객체를 만들 수 있습니다. ex){ person: { name: 'bobby', age: '3' } }
  })
);
//req.body객체를 웹페이지에 json으로 뿌려줄 수 있게 설정.
app.use(bodyParser.json());

//서버가 동작할 수 있도록, express로 시작합니다.
app.listen(portNo, () => {
  console.log('SNS 서버 가동： ', `http://localhost:${portNo}`);
});

// API의 정의
// 사용자가 회원가입할 경우, 몽고디비에 저장합니다.
app.post('/api/adduser', (req, res) => {
  const userid = req.body.userid;
  const passwd = req.body.passwd;
  //만약 아무값도 안적었다면 정보를 적어달라고 알려줍니다.
  if (userid === '' || passwd === '') {
    return res.json({ status: false, msg: '사용자 정보를 적어주세요' });
  }
  // 비밃번호는 해쉬값으로 넣어줍니다.
  const hash = getHash(passwd);
  const token = getAuthToken(userid);

  // 중복된 아이디가 있는 지, 디비에서 확인한다.
  User.findOne({ userid: userid }, function(err, gittens) {
    console.log('사용자아이디가 있는지 확인!');
    //결과값이 1 이상일 경우, 아이디가 중복된다고 알려준다.
    if (gittens) {
      return res.json({ status: false, msg: '아이디가 중복됩니다' });
    }
    //아닐 경우, 회원가입을 시켜준다.
    else {
      const adduser = new User();
      adduser.userid = userid; //아이디
      adduser.hash = hash; //비밀번호
      adduser.token = token; //토큰
      adduser.friends.push(''); //친구들 (현재는 가입했으니 친구를 빈값으로 넣는다)
      adduser.save(err => {
        //에러가 날 경우 에러를 보여주고
        if (err) res.json({ status: false, msg: 'DB에러' });
        //아닐 경우 타임라인 홈페이지로 이동시킨다.
        else res.json({ status: true, msg: '회원가입 완료' });
      });
    }
  });
});

// 사용자 로그인 API를 - 로그인하면 토큰을 반환
app.post('/api/login', (req, res) => {
  const userid = req.body.userid;
  const passwd = req.body.passwd;
  const hash = getHash(passwd); //보안을 위해 비밀번호를 해시키로 바꿔서 디비에 저장합니다.

  //현재 유저가 로그인 하려할 때
  //디비에 데이터가 있는지 확인합니다.
  User.findOne({ userid: userid }, function(err, user) {
    //로그인하려는 아이디 데이터를 가져왔을 때,
    if (user) {
      //해당 데이터의 비밀번호 해시키와 현재 유저가 작성한 비밀번호 해시키를 대조합니다.
      if (user.hash !== hash) {
        //비밀번호가 틀릴경우, 클라이언트에게 알려줍니다.
        console.log(userid + '의 비밀번호가 맞지않음');
        res.json({ status: false, msg: '아이디와 비밀번호를 확인해주세요' });
      } //비밀번호가 같을 경우 true값을 보냅니다.
      else {
        console.log(userid + ' 로그인 성공');
        res.json({ status: true, msg: '인증 성공' });
      }
    } //로그인 하려는 아이디값이 없을 경우
    else {
      console.log(userid + '의 정보가 없는 것 같다.');
      res.json({ status: false, msg: '아이디와 비밀번호를 확인해주세요' });
    }
  });
});

//유저가 다른 회원을 팔로우할 경우,
//유저의 친구목록에 팔로우 할 유저를 추가합니다.
app.get('/api/add_friend', (req, res) => {
  const userid = req.query.userid;
  const friendid = req.query.friendid;
  //먼저 해당 유저의 데이터를 찾아와서 친구목록을 꺼냅니다.
  // 친구목록에 팔로우할 유저를 추가한 뒤, 해당 유저의 정보를 업데이트 합니다.
  User.findOneAndUpdate(
    { userid: userid },
    { $push: { friends: friendid } },
    { upsert: true },
    err => {
      if (err) {
        // 인증 오류
        res.json({ status: false, msg: '인증 오류' });
        return;
      }
      res.json({ status: true });
    }
  );
});

// 유저가 타임라인에 글을 작성하면, 타임라인 디비 목록에 글을 추가합니다.
//uploade.fields를 통해, obj 파일과 mtl 파일을 받을 수 있도록 합니다.
app.get('/api/add_timeline', (req, res) => {
  // 타임 라인에 추가
  //몽구스의 스케마 모델을 가져온다.
  const addTimeline = new Timeline();
  const filetf = req.query.filetf;
  console.log(filetf);
  addTimeline.userid = req.query.userid; //작성한 유저 아이디
  addTimeline.comment = req.query.comment; //작성한 내용
  addTimeline.time = new Date().getTime(); //작성한 시간을 스케마에 넣어서 몽고디비에 저장한다.
  addTimeline.save((err, it) => {
    if (err) {
      res.json({ status: false, msg: 'DB 오류' });
      return;
    }
    console.log(req.query.userid + '가 타임라인을 작성했다');
    console.log(it._id);
    console.log(filetf);
    if (filetf == 'false') {
      console.log(req.query.userid + '가 오브젝트를 안올렸다');
      res.json({ status: false, timelineid: it._id, msg: filetf });
    } else if (filetf == 'true') {
      console.log(req.query.userid + '가 오브젝트를 올렸다');
      res.json({ status: true, timelineid: it._id, msg: filetf });
    }
  });
});

app.post(
  '/api/add_timeline',
  upload.fields([{ name: 'objFile' }, { name: 'mtlFile' }]),
  (req, res) => {
    console.log('사용자가 오브젝트를 올리려한다.');
    console.log(req.files.objFile[0].filename);
    console.log(req.body.timelineid);
    const timelineId = req.body.timelineid;
    Timeline.findOne({ _id: timelineId }, (err, timeline) => {
      if (err) {
        // 인증 오류
        res.json({ status: false, msg: '인증 오류' });
        return;
      }
      timeline.objpath = req.files.objFile[0].filename;
      timeline.mtlpath = req.files.mtlFile[0].filename;
      Timeline.findOneAndUpdate({ _id: timelineId }, timeline, err => {
        if (err) {
          res.json({ status: false });
          return;
        }
        res.json({ status: true });
      });
    });
  }
);

app.get('/api/add_recomment', (req, res) => {
  console.log(req.query.timelineid);
  console.log(req.query.userid);
  console.log(req.query.recomment);

  const timelineId = req.query.timelineid; //댓글을 단 타임라인 id
  const userid = req.query.userid; //댓글 작성한 유저 아이디
  const comment = req.query.recomment; //작성한 내용
  const time = new Date().getTime(); //작성한 시간을 스케마에 넣어서 몽고디비에 저장한다.

  Timeline.findOne({ _id: timelineId }, (err, timeline) => {
    const commentt = { userid: userid, comment: comment, time: time };
    timeline.recomment.push(commentt);
    Timeline.findOneAndUpdate({ _id: timelineId }, timeline, err => {
      if (err) {
        res.json({ status: false });
        return;
      }
      res.json({ status: true });
    });
  });
});

// 친구추가 화면에서 전체 사용자 목록을 가져온다
app.get('/api/get_allusers', (req, res) => {
  const userid = req.query.userid;
  //현재 유저 목록을 요청한 사용자의 아이디만 제외하고
  //전체 친구 목록을 불러온다.
  User.find({ userid: { $ne: userid } }, (err, user) => {
    if (err) return res.json({ status: false });
    //유저들의 아이디만 꺼내서, 이름 목록 배열에 집어넣는다.
    const users = user.map(e => e.userid);
    console.log(users);
    //유저에게 사용자들 목록을 보낸다.
    res.json({ status: true, users: users });
  });
});

//현재 유저의 친구목록을 보내줍니다.
app.get('/api/get_user', (req, res) => {
  const userid = req.query.userid;
  //현재 유저의 아이디로 데이터를 조회한 뒤, 유저의 친구목록을 보냅니다.
  User.findOne({ userid: userid }, (err, user) => {
    console.log(user.friends[1]);
    //처음에 사용자를 생성할 때, 빈값으로 친구를 넣었으므로,
    // 친구가 2이상이 될때 친구목록을 보내줍니다. ex){"","seyoung"}
    if (user.friends.length < 2) return res.json({ status: false });
    //친구가 등록되었을 때 친구목록을 보낸다.
    res.json({ status: true, friends: user.friends });
  }).distinct('friends');
});

// 해당 유저의 친구들 타임 라인을 가져온다. 자신의 타임라인+친구 타임라인
// 또한 사용자의 작성한 글 갯수와, 팔로우 수도 보내준다.
app.get('/api/get_friends_timeline', (req, res) => {
  const userid = req.query.userid;
  //로그인하려는 아이디 데이터가 있을 경우,
  User.findOne({ userid: userid }, (err, user) => {
    //현재 유저의 아이디에 저장되어있는 친구들을 불러와,
    //친구 배열안에 넣어준다.
    //const friends = []
    const friends = user.friends;
    //for (const fname in user.friends) friends.push(fname)
    //현재 사용자의 아이디도 넣어서 사용자 타임라인도 불러온다
    friends.push(userid);
    console.log(friends);

    // 친구 배열에 해당되는 타임 라인을 가져온다.
    Timeline.find({ userid: { $in: friends } })
      .sort({ time: -1 }) //최신 타임라인이 위로 올라오도록 시간을 정렬한다
      .limit(20) //페이징처럼 20개만 불러온다
      .exec((err, docs) => {
        if (err) {
          res.json({ status: false, msg: '디비오류' });
          return;
        } //또한 사용자의 팔로우 수와 글작성 수를 가져온다.
        Timeline.countDocuments({ userid: userid }).exec((err, count) => {
          console.log('작성한 글 갯수' + count);
          console.log('작성한 글 갯수' + friends.length - 1);
          //사용자에게 타임라인 20개 데이터와,        팔로우 수,              현재 사용자 작성글 갯수를 보낸다.
          res.json({
            status: true,
            timelines: docs,
            follow: friends.length - 2,
            write: count,
          });
        });
      });
  }).distinct('friends');
});

// 정적 파일을 자동으로 반환해서 라우팅시킨다.
app.use('/public', express.static('./public'));
app.use('/login', express.static('./public'));
app.use('/users', express.static('./public'));
app.use('/timeline', express.static('./public'));
app.use('/showobj', express.static('./public'));
app.use('/', express.static('./public'));

// 해시 값 (sha512)를 취득. 유저의 비밀번호 값을 보안처리하기 위한 메소드
function getHash(pw) {
  const salt = '::EVuCM0Qffefwe8Krpr';
  const crypto = require('crypto');
  const hashsum = crypto.createHash('sha512');
  hashsum.update(pw + salt);
  return hashsum.digest('hex');
}
//토큰 값을 유저 아이디와 시간값으로 해쉬값을 만들어 가져온다.
function getAuthToken(userid) {
  const time = new Date().getTime();
  return getHash(`${userid}:${time}`);
}
