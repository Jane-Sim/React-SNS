const mongoose = require('mongoose')

mongoose.Promise = global.Promise

// 스키마 만들기
const userDB = new mongoose.Schema({
    userid: String,
    hash: String,
    token: String,
    friends:  [String]
})

const timelineDB = new mongoose.Schema({
    userid: String,
    comment: String,
    time: String,
    objpath:{
        type:String,
        required:false
    },
    mtlpath: {
        type:String,
        required:false
    }
})




// 모델 만들기
const User = mongoose.model ( 'user', userDB)
const Timeline = mongoose.model ( 'timeline', timelineDB)
// 모델을 export
module.exports = {
    User, Timeline
}
