var db = require('../../config/connection')
var objectId = require('mongodb').ObjectId


module.exports = {

    getAllUsers:async(callback)=>{
        let users = await db.get().collection('users').find().toArray()
        for(var i = 0; i<users.length; i++){
            let date = users[i]._id.getTimestamp()
            let year = date.getFullYear()
            let month = date.getMonth()
            let day = date.getDate()

            let months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

           users[i].date = day+"/"+months[month]+"/"+year
        }
        callback(users)
    },


    blockuser : (id)=>{
        db.get().collection('users').updateOne({_id:objectId(id)},{$set:{block:true}})
    },

    unblockuser : (id)=>{
        db.get().collection('users').updateOne({_id:objectId(id)},{$set:{block:false}})
    }
    
}