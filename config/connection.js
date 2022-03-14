const mongoClient = require('mongodb').MongoClient

const state = {
    db:null
}

module.exports.connect = function(done){
    const url = 'mongodb+srv://faisal:mBgBIHLybatbOt32@kidsworld.36ptq.mongodb.net/KidsWorld?retryWrites=true&w=majority'
    const dbname = 'KidsWorld'

    mongoClient.connect(url,(err,data)=>{
        if(err){
            return done(err)
        }        
    state.db = data.db(dbname)
    done()
    })
}

module.exports.get = function(){
    return state.db
}