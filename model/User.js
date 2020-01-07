var mongoUtil = require('../mongoUtils');

function getUsers(data){
    
    mongoUtil.getDriver().collection('users').find({email:data}).toArray(function(err, result){
        if(err) throw err;
        console.log(result);
        return result[0];
    });
    
};

module.exports = {
    getUsers
};