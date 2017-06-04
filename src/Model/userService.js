"use strict";

/**
 * Array of User objects
 */
const dbUsers = require('./dbMiddleMan.js');

module.exports = {
    'find': find,
    'authenticate': authenticate
}

function find(username, cb) {
    dbUsers.find(username,(err,body)=> {
        if (err)console.log(err);
        else {
            if (!body.user_obj) return cb(new Error('User does not exists'));
            cb(null, body.user_obj);
        }
    });
}

function authenticate(username, passwd, cb) {
    dbUsers.find(username,(err,body)=>{
        if(err)console.log(err);
        else{
            if(!body.user_obj) return cb(new Error('User does not exist  '));
            if(passwd != body.user_obj.password) return cb(new Error('Invalid password'));
            cb(null, body.user_obj);
        }
    });
}