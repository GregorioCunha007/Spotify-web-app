// Old requires
const http = require('http');
const url = require('url');
const controller = require('./src/Controller/spotifyController.js');

// New requires

const path = require('path');
const express = require('express');
const favicon = require('serve-favicon');
const ecstatic = require('ecstatic');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const PassportStrategy = require('passport-local').Strategy;
const userService = require('./src/Model/userService.js');
const expressSession = require('express-session');
const server = express();

server.set('views',path.join(__dirname,'views'));
server.set('view engine', 'hbs');

passport.use(new PassportStrategy((username,password,done) => {
      userService.authenticate(username,password,done);
}));
passport.deserializeUser((user,done)=>{
  userService.find(user,done);
});
passport.serializeUser((user,done)=>{
  done(null,user.username);
});

server.use(favicon(__dirname + '/public/favicon.ico'));
server.use(ecstatic({root: __dirname + '/public' }));
server.use(expressSession({ secret : 'keyboard cat', resave: true, saveUninitialized: true}));
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(cookieParser());
server.use(passport.initialize());
server.use(passport.session());
server.use(controller.handlers);
server.post('/login', function(req,res, next){
    controller.login(req,res,next,passport);
});
server.get('/logout',(req,res)=>{
    req.logout();
    res.redirect('/home');
});
server.post('/newPlaylist', function(req,res,next){
    controller.newPlaylist(req.user.username,req.body.playlist,()=>{
        res.redirect(req.get('referer'));
    });
});
server.post('/addToPlaylist',function(req,res,next){
    controller.addToPlaylist(req,res,next);
});
server.post('/deletePlaylist',function (req,res,next) {
    controller.deletePlaylist(req.user.username,req.body.playlist,()=>{
        res.redirect(req.get('referer'));
    });
});
server.post('/deleteTrack',function(req,res,next){
    controller.deleteFromPlaylist(req.user.username,req.body.playlist,req.body.trackId,()=>{
        res.redirect(req.get('referer'));
    });
});
server.put('/shareWith', function(req,res,next){
    controller.forwardInvitation(req,res);
});
server.put('/invitationDecision', function (req,res,next) {
    const data = req.body;
    if(data.accepted){
        controller.acceptInvitation(req,res,data);
    }else{
        controller.refuseInvitation(req,res,data);
    }
});
server.post('/searchForm',function(req,res,next){
    res.redirect('/search?name='+req.body.artist);
});
server.use((err, req, resp, next) => {
    console.log('500 error');
    resp.writeHead(500);
    resp.write(err.message);
    resp.end(); // Termina a ligação
});
server.use((req, resp) => {
    console.log('404 error');
    resp.writeHead(404);
    resp.end(); // Termina a ligação
});

server.listen(3000);
console.log("Running milord :D");
module.exports = server;