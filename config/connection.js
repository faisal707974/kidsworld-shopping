const mongoClient = require('mongodb').MongoClient

const state = {
    db:null
}

module.exports.connect = function(done){
    const url = 'mongodb://localhost:27017'
    const dbname = 'kidsWorld'

    mongoClient.connect(url,(err,data)=>{
        if(err){
            console.log({err})
            return done(err)
        }        
    state.db = data.db(dbname)
    done()
    })
}

module.exports.get = function(){
    return state.db
}