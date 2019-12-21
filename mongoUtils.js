const mongo = require('mongodb');
var driver  = mongo.MongoClient;
var database;

module.exports = {

    conectToServer: function(callback){
        driver.connect("mongodb+srv://brunorocha:brunorocha@cluster0-ezxij.mongodb.net/test?retryWrites=true&w=majority",{useUnifiedTopology:true},
            function(err,client){
                if(err) throw err;
                database = client.db('ProjetoNodejs');
                console.log("Connected to the database");
                return callback(err);
            });
    },

    getDriver: function(){
        return database;
    }

}