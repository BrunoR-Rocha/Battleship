var mongoUtil = require('../mongoUtils');
var mongoose = require('mongoose');

function getUsers(data){
    
    mongoUtil.getDriver().collection('users').find({email:data}).toArray(function(err, result){
        if(err) throw err;
        console.log(result);
        return result[0];
    });
};

function createUsers(){
    mongoose.model('User',{
        name: String,
        email: String,
        password: String
    });
}

module.exports = {
    getUsers,
    createUsers
};